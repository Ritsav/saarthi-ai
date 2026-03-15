import { env } from '../../config/env';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { GeminiProvider } from './gemini';
import { LLMMessage, LLMProvider } from './provider';

type ProviderName = 'gemini' | 'openai' | 'anthropic';

let cachedProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  const providerName = env.ACTIVE_LLM_PROVIDER as ProviderName;

  if (providerName !== 'gemini') {
    throw new AppError(
      503,
      'LLM_PROVIDER_UNAVAILABLE',
      `Provider ${providerName} is not implemented yet. Set ACTIVE_LLM_PROVIDER=gemini for Phase 5.`
    );
  }

  cachedProvider = new GeminiProvider();
  logger.info({ provider: cachedProvider.name }, 'Initialized LLM provider');
  return cachedProvider;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new AppError(503, 'LLM_TIMEOUT', `LLM request exceeded ${timeoutMs}ms timeout.`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function safeLLMChat(
  messages: LLMMessage[],
  timeoutMs = 60000
): Promise<{ content: string }> {
  try {
    const provider = getLLMProvider();
    const response = await withTimeout(provider.chat(messages), timeoutMs);
    return { content: response.content };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown LLM error';
    logger.error({ provider: env.ACTIVE_LLM_PROVIDER, message }, 'LLM request failed');
    throw new AppError(503, 'LLM_ERROR', 'AI service is temporarily unavailable. Please try again later.');
  }
}
