import { ProcessType } from '@prisma/client';
import { z } from 'zod';
import { portalKeySchema } from '../services/autofill/portals';

export const processTypeParamSchema = z.object({
  processType: z.nativeEnum(ProcessType),
});

export const processTypeQuerySchema = z.object({
  processType: z.nativeEnum(ProcessType).optional(),
});

export const portalKeyParamSchema = z.object({
  portalKey: portalKeySchema,
});
