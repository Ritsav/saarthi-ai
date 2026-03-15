import { DocumentStatus, DocumentType, ProcessType } from '@prisma/client';
import { z } from 'zod';

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const uploadDocumentBodySchema = z.object({
  document_type: z.preprocess(emptyStringToUndefined, z.nativeEnum(DocumentType).optional()),
  process_type: z.preprocess(emptyStringToUndefined, z.nativeEnum(ProcessType).optional()),
  chat_id: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  document_type: z.preprocess(emptyStringToUndefined, z.nativeEnum(DocumentType).optional()),
  process_type: z.preprocess(emptyStringToUndefined, z.nativeEnum(ProcessType).optional()),
  status: z.preprocess(emptyStringToUndefined, z.nativeEnum(DocumentStatus).optional()),
  chat_id: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
  include_mock: z
    .preprocess((value) => {
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
    }, z.boolean().optional())
    .default(false),
});
