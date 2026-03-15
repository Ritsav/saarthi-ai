import { ProcessType } from '@prisma/client';
import { runSimpleChat } from './llm/chat-runner';
import { logger } from '../utils/logger';

interface ResponderInput {
  userMessage: string;
  processType: ProcessType | null;
}

export interface ResponderChunk {
  content: string;
  fallbackUsed: boolean;
}

function processLabel(processType: ProcessType | null): string {
  if (!processType) {
    return 'general guidance';
  }

  return processType.replace(/_/g, ' ').toLowerCase();
}

function chunkText(text: string, chunkSize = 24): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += chunkSize) {
    chunks.push(text.slice(index, index + chunkSize));
  }
  return chunks;
}

export class EchoResponder {
  public readonly name = 'gemini_responder';

  public async *streamResponse(input: ResponderInput): AsyncIterable<ResponderChunk> {
    const prompt = [
      `Context: user is asking about ${processLabel(input.processType)}.`,
      input.userMessage.trim(),
    ].join('\n\n');

    let response: string;
    let fallbackUsed = false;

    try {
      response = await runSimpleChat(prompt);
    } catch (error) {
      fallbackUsed = true;
      logger.warn(
        {
          responder: this.name,
          error: error instanceof Error ? error.message : 'unknown_error',
        },
        'Gemini response failed, using fallback responder output'
      );

      response = [
        `I received your message about ${processLabel(input.processType)}.`,
        'Gemini is unavailable right now, so this is a local fallback response.',
        `You said: "${input.userMessage.trim()}"`,
      ].join(' ');
    }

    const chunks = chunkText(response);
    for (const chunk of chunks) {
      yield {
        content: chunk,
        fallbackUsed,
      };
    }
  }
}
