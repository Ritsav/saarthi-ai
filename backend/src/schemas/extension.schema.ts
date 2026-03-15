import { ProcessType } from '@prisma/client';
import { z } from 'zod';

function emptyToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const exportToExtensionBodySchema = z.object({
  process_type: z.preprocess(emptyToUndefined, z.nativeEnum(ProcessType).optional()),
  values: z.record(z.string(), z.string()).default({}),
});
