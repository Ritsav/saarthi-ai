import { LLMMessage } from './provider';
import { safeLLMChat } from './index';

export async function runSimpleChat(userPrompt: string): Promise<string> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: 'You are Saarthi AI backend test responder. Keep answers short.',
    },
    {
      role: 'user',
      content: userPrompt,
    },
  ];

  const result = await safeLLMChat(messages, 60000);
  return result.content;
}
