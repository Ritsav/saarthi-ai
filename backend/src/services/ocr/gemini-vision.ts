import fs from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentType } from '@prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';

const PREFERRED_VISION_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
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

  private resolvedModelName: string | null = null;

  private async resolveModelName(): Promise<string> {
    if (this.resolvedModelName) {
      return this.resolvedModelName;
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
          }>;
        };

        const supported = (payload.models ?? [])
          .filter((model) => (model.supportedGenerationMethods ?? []).includes('generateContent'))
          .map((model) => (model.name ?? '').replace(/^models\//, ''))
          .filter((name) => name.length > 0);

        const preferred = PREFERRED_VISION_MODELS.find((model) => supported.includes(model));
        this.resolvedModelName = preferred ?? supported[0] ?? PREFERRED_VISION_MODELS[0];
        return this.resolvedModelName;
      }
    } catch {
      // fallback below
    }

    this.resolvedModelName = PREFERRED_VISION_MODELS[0];
    return this.resolvedModelName;
  }

  async extractRawText(
    absoluteFilePath: string,
    mimeType: string,
    documentType: DocumentType
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new AppError(503, 'OCR_PROVIDER_UNAVAILABLE', 'GEMINI_API_KEY is required for OCR');
    }

    const modelName = await this.resolveModelName();
    const model = this.client.getGenerativeModel({ model: modelName });

    const fileBuffer = await fs.readFile(absoluteFilePath);
    const base64 = fileBuffer.toString('base64');

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

    return content;
  }
}

export const geminiVisionService = new GeminiVisionService();
