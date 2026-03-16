import fs from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentType } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { localOCRService } from './local-ocr';

const PREFERRED_VISION_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
];

const MODEL_NAME_BLOCKLIST = [
  /tts/i,
  /embedding/i,
  /aqa/i,
  /transcribe/i,
  /speech/i,
  /imagen/i,
  /veo/i,
];

function buildRawTextPrompt(documentType: DocumentType): string {
  return [
    `You are an OCR engine. The document type is ${documentType}.`,
    'Extract all visible text from the document.',
    'Return plain text only with line breaks.',
    'Do not add explanations or markdown formatting.',
  ].join(' ');
}

export class GeminiVisionService {
  private readonly client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

  private resolvedModelNames: string[] | null = null;

  private prioritizeModels(models: string[]): string[] {
    const preferred = PREFERRED_VISION_MODELS.filter((model) => models.includes(model));
    const remaining = models.filter((model) => !preferred.includes(model));
    return [...preferred, ...remaining];
  }

  private isModelNameAllowed(modelName: string): boolean {
    return !MODEL_NAME_BLOCKLIST.some((pattern) => pattern.test(modelName));
  }

  private isRateLimitError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('quota') ||
      message.includes('rate limit')
    );
  }

  private isImageModalityError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      message.includes('image input modality is not enabled') ||
      message.includes('input modality') ||
      message.includes('unsupported modality')
    );
  }

  private isTransientModelError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
      message.includes('404') ||
      message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('not available')
    );
  }

  private supportsImageInput(model: {
    supportedInputModalities?: string[];
    inputTokenLimit?: number;
  }): boolean {
    const inputModalities = model.supportedInputModalities;
    if (Array.isArray(inputModalities) && inputModalities.length > 0) {
      return inputModalities.some((modality) => modality.toUpperCase() === 'IMAGE');
    }

    return true;
  }

  private supportsTextOutput(model: {
    supportedOutputModalities?: string[];
  }): boolean {
    const outputModalities = model.supportedOutputModalities;
    if (Array.isArray(outputModalities) && outputModalities.length > 0) {
      return outputModalities.some((modality) => modality.toUpperCase() === 'TEXT');
    }

    return true;
  }

  private async resolveModelNames(): Promise<string[]> {
    if (this.resolvedModelNames && this.resolvedModelNames.length > 0) {
      return this.resolvedModelNames;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${env.GEMINI_API_KEY}`
      );

      if (response.ok) {
        const payload = (await response.json()) as {
          models?: Array<{
            name?: string;
            supportedGenerationMethods?: string[];
            supportedInputModalities?: string[];
            supportedOutputModalities?: string[];
          }>;
        };

        const supported = (payload.models ?? [])
          .filter((model) => (model.supportedGenerationMethods ?? []).includes('generateContent'))
          .filter((model) => this.supportsImageInput(model))
          .filter((model) => this.supportsTextOutput(model))
          .map((model) => (model.name ?? '').replace(/^models\//, ''))
          .filter((name) => name.length > 0)
          .filter((name) => this.isModelNameAllowed(name));

        const prioritized = this.prioritizeModels(supported);
        this.resolvedModelNames = prioritized.length > 0 ? prioritized : [...PREFERRED_VISION_MODELS];
        return this.resolvedModelNames;
      }
    } catch {
      // fallback below
    }

    this.resolvedModelNames = [...PREFERRED_VISION_MODELS];
    return this.resolvedModelNames;
  }

  async extractRawText(
    absoluteFilePath: string,
    mimeType: string,
    documentType: DocumentType
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(503, 'OCR_PROVIDER_UNAVAILABLE', 'GEMINI_API_KEY is required for OCR');
    }

    const fileBuffer = await fs.readFile(absoluteFilePath);
    const base64 = fileBuffer.toString('base64');
    const modelNames = await this.resolveModelNames();
    let lastError: unknown = null;

    for (const modelName of modelNames) {
      try {
        if (!this.isModelNameAllowed(modelName)) {
          continue;
        }

        const model = this.client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          {
            text: buildRawTextPrompt(documentType),
          },
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ]);

        const content = result.response.text().trim();
        if (!content) {
          throw new AppError(502, 'OCR_EMPTY_RESULT', 'OCR returned empty output');
        }

        // Keep successful model first for next requests.
        this.resolvedModelNames = [modelName, ...modelNames.filter((item) => item !== modelName)];
        return content;
      } catch (error) {
        lastError = error;

        if (!this.isRateLimitError(error) && !this.isImageModalityError(error) && !this.isTransientModelError(error)) {
          throw error;
        }
      }
    }

    if (localOCRService.canRun(mimeType)) {
      const fallbackText = await localOCRService.extractRawTextFromImage(absoluteFilePath);
      if (fallbackText.trim().length > 0) {
        return fallbackText;
      }
    }

    const details = lastError instanceof Error ? lastError.message : 'Unknown OCR provider failure';
    const errorCode = this.isRateLimitError(lastError)
      ? 'OCR_PROVIDER_RATE_LIMITED'
      : 'OCR_PROVIDER_FAILED';
    const message = this.isRateLimitError(lastError)
      ? `OCR provider limit reached and local fallback failed: ${details}`
      : `No compatible Gemini vision model succeeded and local fallback failed: ${details}`;

    throw new AppError(503, errorCode, message);
  }
}

export const geminiVisionService = new GeminiVisionService();
