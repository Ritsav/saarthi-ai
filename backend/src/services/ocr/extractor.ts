import { DocumentType } from '@prisma/client';
import { extractedDocumentSchema, type ExtractedDocument } from '../../schemas/extracted.schema';
import { getLLMProvider } from '../llm';
import { AppError } from '../../utils/errors';

function buildExtractionPrompt(documentType: DocumentType): string {
  const sharedRules = [
    'You are an OCR data extraction engine for Nepali government documents.',
    'Return strictly valid JSON and no markdown.',
    'If a field is not visible, use null for that field.',
    'Use confidence.overall and confidence.per_field values between 0 and 1.',
    'Use concise plain text for values.',
  ].join(' ');

  if (documentType === DocumentType.CITIZENSHIP) {
    return `${sharedRules} Output JSON schema: {"document_type":"CITIZENSHIP","fields":{"name_en":string|null,"name_ne":string|null,"citizenship_number":string|null,"date_of_birth":string|null,"issue_date":string|null,"issue_district":string|null,"father_name":string|null,"mother_name":string|null,"address":string|null,"photo_detected":boolean|null,"signature_detected":boolean|null},"confidence":{"overall":number,"per_field":{"name_en":number,"name_ne":number,"citizenship_number":number,"date_of_birth":number,"issue_date":number,"issue_district":number,"father_name":number,"mother_name":number,"address":number,"photo_detected":number,"signature_detected":number}},"raw_text":string}`;
  }

  if (documentType === DocumentType.PASSPORT_PHOTO) {
    return `${sharedRules} Output JSON schema: {"document_type":"PASSPORT_PHOTO","fields":{"face_detected":boolean|null,"face_centered":boolean|null,"background_color":string|null,"resolution_sufficient":boolean|null,"lighting_quality":string|null},"confidence":{"overall":number,"per_field":{"face_detected":number,"face_centered":number,"background_color":number,"resolution_sufficient":number,"lighting_quality":number}},"raw_text":string}`;
  }

  return `${sharedRules} Output JSON schema: {"document_type":"PAN_CERTIFICATE","fields":{"pan_number":string|null,"registered_name":string|null,"business_type":string|null,"registration_date":string|null,"tax_office":string|null},"confidence":{"overall":number,"per_field":{"pan_number":number,"registered_name":number,"business_type":number,"registration_date":number,"tax_office":number}},"raw_text":string}`;
}

function parseJsonResponse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    throw new AppError(502, 'EXTRACTION_INVALID_JSON', 'LLM did not return valid JSON');
  }
}

export const ocrExtractor = {
  async extractFromRawText(rawText: string, documentType: DocumentType): Promise<ExtractedDocument> {
    const prompt = buildExtractionPrompt(documentType);
    const provider = getLLMProvider();

    const response = await provider.chat(
      [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: `Extract structured fields from this OCR text:\n\n${rawText}`,
      },
      ],
      {
        temperature: 0,
        maxTokens: 1200,
      }
    );

    const parsed = extractedDocumentSchema.safeParse(parseJsonResponse(response.content));
    if (!parsed.success) {
      throw new AppError(422, 'EXTRACTION_SCHEMA_MISMATCH', 'Extracted payload does not match schema');
    }

    if (parsed.data.document_type !== documentType) {
      throw new AppError(422, 'EXTRACTION_DOCUMENT_TYPE_MISMATCH', 'Extracted document type mismatch');
    }

    return parsed.data;
  },
};
