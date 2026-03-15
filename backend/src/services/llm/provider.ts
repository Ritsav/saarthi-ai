export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
}

export interface LLMStreamChunk {
  content: string;
  finishReason?: string | null;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMChatResponse {
  content: string;
  usage: LLMUsage;
  finishReason: string;
}

export interface LLMEmbeddingResponse {
  embedding: number[];
  usage: {
    totalTokens: number;
  };
}

export abstract class LLMProvider {
  public abstract readonly name: string;

  public abstract chat(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): Promise<LLMChatResponse>;

  public abstract stream(
    messages: LLMMessage[],
    options?: LLMChatOptions
  ): AsyncIterable<LLMStreamChunk>;

  public abstract embed(text: string): Promise<LLMEmbeddingResponse>;
}
