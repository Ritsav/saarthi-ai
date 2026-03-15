import { z } from 'zod';

const confidenceScoreSchema = z.number().min(0).max(1);

const optionalTextSchema = z.string().trim().min(1).nullable().optional();

const confidenceSchema = z
  .object({
    overall: confidenceScoreSchema,
    per_field: z.record(confidenceScoreSchema).default({}),
  })
  .optional();

export const citizenshipExtractionSchema = z.object({
  document_type: z.literal('CITIZENSHIP'),
  fields: z.object({
    name_en: optionalTextSchema,
    name_ne: optionalTextSchema,
    citizenship_number: optionalTextSchema,
    date_of_birth: optionalTextSchema,
    issue_date: optionalTextSchema,
    issue_district: optionalTextSchema,
    father_name: optionalTextSchema,
    mother_name: optionalTextSchema,
    address: optionalTextSchema,
    photo_detected: z.boolean().optional(),
    signature_detected: z.boolean().optional(),
  }),
  confidence: confidenceSchema,
  raw_text: z.string().optional(),
});

export const passportPhotoExtractionSchema = z.object({
  document_type: z.literal('PASSPORT_PHOTO'),
  fields: z.object({
    face_detected: z.boolean().optional(),
    face_centered: z.boolean().optional(),
    background_color: optionalTextSchema,
    resolution_sufficient: z.boolean().optional(),
    lighting_quality: optionalTextSchema,
  }),
  confidence: confidenceSchema,
  raw_text: z.string().optional(),
});

export const extractedDocumentSchema = z.discriminatedUnion('document_type', [
  citizenshipExtractionSchema,
  passportPhotoExtractionSchema,
]);

export type CitizenshipExtraction = z.infer<typeof citizenshipExtractionSchema>;
export type PassportPhotoExtraction = z.infer<typeof passportPhotoExtractionSchema>;
export type ExtractedDocument = z.infer<typeof extractedDocumentSchema>;
