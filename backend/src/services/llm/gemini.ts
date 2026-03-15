import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import {
  LLMChatOptions,
  LLMChatResponse,
  LLMEmbeddingResponse,
  LLMMessage,
  LLMProvider,
  LLMStreamChunk,
} from './provider';

const PREFERRED_MODEL_ORDER = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

type GeminiRole = 'user' | 'model';

function mapRole(role: LLMMessage['role']): GeminiRole {
  if (role === 'assistant') {
    return 'model';
  }

  return 'user';
}

function toGeminiHistory(messages: LLMMessage[]) {
  const nonSystem = messages.filter((message) => message.role !== 'system');

  return nonSystem.slice(0, -1).map((message) => ({
    role: mapRole(message.role),
    parts: [{ text: message.content }],
  }));
}

function buildSystemInstruction(messages: LLMMessage[]): string | undefined {
  const systemText = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n');

  return systemText || undefined;
}

function getLastPrompt(messages: LLMMessage[]): string {
  const nonSystem = messages.filter((message) => message.role !== 'system');
  const last = nonSystem[nonSystem.length - 1];
  return last?.content ?? '';
}

export class GeminiProvider extends LLMProvider {
  public readonly name = 'gemini';

  private readonly genAI: GoogleGenerativeAI;

  private resolvedModelName: string | null = null;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

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
          .filter((modelName) => modelName.length > 0);

        const preferred = PREFERRED_MODEL_ORDER.find((model) => supported.includes(model));
        this.resolvedModelName = preferred ?? supported[0] ?? PREFERRED_MODEL_ORDER[0];
        return this.resolvedModelName;
      }
    } catch {
      // Fallback handled below.
    }

    this.resolvedModelName = PREFERRED_MODEL_ORDER[0];
    return this.resolvedModelName;
  }

  public async chat(messages: LLMMessage[], options?: LLMChatOptions): Promise<LLMChatResponse> {
    const modelName = await this.resolveModelName();

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topP: options?.topP ?? 1,
      },
      systemInstruction: buildSystemInstruction(messages),
    });

    const chat = model.startChat({
      history: toGeminiHistory(messages),
    });

    const result = await chat.sendMessage(getLastPrompt(messages));
    const response = result.response;

    return {
      content: response.text(),
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      },
      finishReason: response.candidates?.[0]?.finishReason ?? 'STOP',
    };
  }

  public async *stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk> {
    const modelName = await this.resolveModelName();

    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
        topP: options?.topP ?? 1,
      },
      systemInstruction: buildSystemInstruction(messages),
    });

    const chat = model.startChat({
      history: toGeminiHistory(messages),
    });

    const streamResult = await chat.sendMessageStream(getLastPrompt(messages));

    for await (const chunk of streamResult.stream) {
      const content = chunk.text();
      if (content) {
        yield {
          content,
          finishReason: null,
        };
      }
    }
  }

  public async embed(_text: string): Promise<LLMEmbeddingResponse> {
    throw new Error('Embeddings are not implemented in Phase 5 (Gemini-first mode).');
  }
}
