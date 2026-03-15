import 'dotenv/config';
import { z } from 'zod';

function parseBooleanEnv(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional().default(''),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(25),
  UPLOAD_DIR: z.string().default('uploads'),
  FILE_CLEANUP_ENABLED: z.preprocess(parseBooleanEnv, z.boolean()).default(true),
  FILE_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
  FILE_CLEANUP_INTERVAL_MINUTES: z.coerce.number().int().positive().default(60),
  PINECONE_API_KEY: z.string().optional().default(''),
  PINECONE_INDEX: z.string().default('saarthi-gov-docs'),
  ACTIVE_LLM_PROVIDER: z.enum(['openai', 'anthropic', 'gemini']).default('gemini'),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
