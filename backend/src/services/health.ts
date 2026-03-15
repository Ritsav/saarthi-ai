import { env } from '../config/env';

interface HealthDependency {
  status: 'configured' | 'not_configured';
  detail?: string;
}

export interface HealthReport {
  status: 'healthy';
  checks: {
    database: HealthDependency;
    pinecone: HealthDependency;
    llm_provider: HealthDependency;
  };
}

function configured(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

export function getHealthReport(): HealthReport {
  const hasDatabase = configured(env.DATABASE_URL);
  const hasPinecone = configured(env.PINECONE_API_KEY);

  const llmConfiguredByProvider =
    (env.ACTIVE_LLM_PROVIDER === 'openai' && configured(env.OPENAI_API_KEY)) ||
    (env.ACTIVE_LLM_PROVIDER === 'anthropic' && configured(env.ANTHROPIC_API_KEY)) ||
    (env.ACTIVE_LLM_PROVIDER === 'gemini' && configured(env.GEMINI_API_KEY));

  return {
    status: 'healthy',
    checks: {
      database: hasDatabase
        ? { status: 'configured' }
        : { status: 'not_configured', detail: 'Set DATABASE_URL to enable DB checks.' },
      pinecone: hasPinecone
        ? { status: 'configured' }
        : { status: 'not_configured', detail: 'Set PINECONE_API_KEY to enable Pinecone checks.' },
      llm_provider: llmConfiguredByProvider
        ? { status: 'configured' }
        : {
            status: 'not_configured',
            detail: `Set API key for ACTIVE_LLM_PROVIDER=${env.ACTIVE_LLM_PROVIDER}.`,
          },
    },
  };
}
