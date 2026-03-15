import { DocumentType } from '@prisma/client';
import { extractedDocumentSchema, type ExtractedDocument } from '../../schemas/extracted.schema';
import { getLLMProvider } from '../llm';
import { AppError } from '../../utils/errors';
import { normalizeExtractionPayload, parseJsonObjectFromLLM } from './extraction-utils';

const DEVANAGARI_DIGIT_PATTERN = /[\u0966-\u096F]/g;

function normalizeDigits(value: string): string {
  return value.replace(DEVANAGARI_DIGIT_PATTERN, (char) =>
    String(char.charCodeAt(0) - 0x0966)
  );
}

function compactWhitespace(value: string): string {
  return normalizeDigits(value).replace(/\s+/g, ' ').trim();
}

function findLineValue(rawText: string, labels: string[]): string | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const normalized = line.toLowerCase();
    for (const label of labels) {
      const labelLower = label.toLowerCase();
      if (!normalized.includes(labelLower)) {
        continue;
      }

      const parts = line.split(/[:\-]/);
      if (parts.length > 1) {
        const candidate = compactWhitespace(parts.slice(1).join(' '));
        if (candidate.length > 1) {
          return candidate;
        }
      }

      const stripped = compactWhitespace(
        line.replace(new RegExp(label, 'ig'), '').replace(/[:\-]/g, ' ')
      );
      if (stripped.length > 1) {
        return stripped;
      }
    }
  }

  return null;
}

function parseDateCandidate(value: string): string | null {
  const normalized = compactWhitespace(value);

  let match = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
  }

  match = normalized.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${String(Number(m)).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`;
  }

  return null;
}

function collectDates(rawText: string): string[] {
  const matches = rawText.match(/\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/g) ?? [];
  const normalized = matches
    .map((item) => parseDateCandidate(item))
    .filter((item): item is string => Boolean(item));

  return [...new Set(normalized)];
}

function findCitizenshipNumber(rawText: string): string | null {
  const normalized = normalizeDigits(rawText);
  const labeled = normalized.match(
    /(?:citizenship|citizen|नागरिकता)[^A-Z0-9]*([A-Z0-9\-\/]{5,})/i
  );
  if (labeled?.[1]) {
    return compactWhitespace(labeled[1]);
  }

  const candidates = normalized.match(/\b[A-Z0-9\-\/]{6,}\b/g) ?? [];
  const withDigits = candidates.filter((item) => (item.match(/\d/g) ?? []).length >= 6);
  return withDigits[0] ? compactWhitespace(withDigits[0]) : null;
}

function buildFallbackCitizenshipExtraction(rawText: string): unknown {
  const dates = collectDates(rawText);
  const dateOfBirth = dates[0] ?? null;
  const issueDate = dates[1] ?? null;

  const fields = {
    name_en: findLineValue(rawText, ['name', 'full name']),
    name_ne: findLineValue(rawText, ['नाम']),
    citizenship_number: findCitizenshipNumber(rawText),
    date_of_birth: dateOfBirth,
    issue_date: issueDate,
    issue_district: findLineValue(rawText, ['district', 'issue district', 'जिल्ला']),
    father_name: findLineValue(rawText, ['father', 'father name', 'बाबु']),
    mother_name: findLineValue(rawText, ['mother', 'mother name', 'आमा']),
    address: findLineValue(rawText, ['address', 'ठेगाना']),
    photo_detected: undefined,
    signature_detected: undefined,
  };

  const populatedFields = Object.entries(fields).filter(([_, value]) => {
    return typeof value === 'string' ? value.trim().length > 0 : typeof value === 'boolean';
  });

  const perField = populatedFields.reduce<Record<string, number>>((acc, [key]) => {
    acc[key] = 0.35;
    return acc;
  }, {});

  return {
    document_type: 'CITIZENSHIP',
    fields,
    confidence: {
      overall: populatedFields.length > 0 ? 0.35 : 0,
      per_field: perField,
    },
    raw_text: rawText,
  };
}

function buildFallbackPassportPhotoExtraction(rawText: string): unknown {
  const normalized = rawText.toLowerCase();
  const faceDetected =
    normalized.includes('face') || normalized.includes('portrait') || normalized.includes('photo')
      ? true
      : undefined;

  return {
    document_type: 'PASSPORT_PHOTO',
    fields: {
      face_detected: faceDetected,
      face_centered: undefined,
      background_color: null,
      resolution_sufficient: undefined,
      lighting_quality: null,
    },
    confidence: {
      overall: faceDetected ? 0.3 : 0,
      per_field: faceDetected ? { face_detected: 0.3 } : {},
    },
    raw_text: rawText,
  };
}

function buildFallbackExtraction(rawText: string, documentType: DocumentType): unknown {
  if (documentType === DocumentType.CITIZENSHIP) {
    return buildFallbackCitizenshipExtraction(rawText);
  }

  if (documentType === DocumentType.PASSPORT_PHOTO) {
    return buildFallbackPassportPhotoExtraction(rawText);
  }

  throw new AppError(422, 'UNSUPPORTED_DOCUMENT_TYPE', `Unsupported document type: ${documentType}`);
}

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

  throw new AppError(422, 'UNSUPPORTED_DOCUMENT_TYPE', `Unsupported document type: ${documentType}`);
}

export const ocrExtractor = {
  async extractFromRawText(rawText: string, documentType: DocumentType): Promise<ExtractedDocument> {
    const prompt = buildExtractionPrompt(documentType);
    const provider = getLLMProvider();
    const trimmedRawText = rawText.length > 32000 ? rawText.slice(0, 32000) : rawText;

    let rawPayload: unknown;
    try {
      const response = await provider.chat(
        [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `Extract structured fields from this OCR text:\n\n${trimmedRawText}`,
          },
        ],
        {
          temperature: 0,
          maxTokens: 1200,
        }
      );

      rawPayload = parseJsonObjectFromLLM(response.content);
    } catch {
      rawPayload = buildFallbackExtraction(trimmedRawText, documentType);
    }

    const normalizedPayload = normalizeExtractionPayload(rawPayload, documentType);
    const parsed = extractedDocumentSchema.safeParse(normalizedPayload);
    if (!parsed.success) {
      throw new AppError(422, 'EXTRACTION_SCHEMA_MISMATCH', 'Extracted payload does not match schema');
    }

    if (parsed.data.document_type !== documentType) {
      throw new AppError(422, 'EXTRACTION_DOCUMENT_TYPE_MISMATCH', 'Extracted document type mismatch');
    }

    return parsed.data;
  },
};
