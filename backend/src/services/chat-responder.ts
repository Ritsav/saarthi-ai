import { ProcessType } from '@prisma/client';

interface ResponderInput {
  userMessage: string;
  processType: ProcessType | null;
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
  public readonly name = 'echo_responder';

  public async *streamResponse(input: ResponderInput): AsyncIterable<string> {
    const response = [
      `I received your message about ${processLabel(input.processType)}.`,
      'AI agent integration is not active yet, so this is a temporary response.',
      `You said: "${input.userMessage.trim()}"`,
      'Your message is saved and ready for Phase 5+ integrations.',
    ].join(' ');

    const chunks = chunkText(response);
    for (const chunk of chunks) {
      yield chunk;
    }
  }
}
