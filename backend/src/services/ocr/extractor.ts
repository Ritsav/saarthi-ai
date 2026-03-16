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

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 1) {
    return 1;
  }

  return value;
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

function inferFieldConfidence(fieldName: string, value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'boolean') {
    return 0.6;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = compactWhitespace(value);
  if (!normalized) {
    return null;
  }

  const key = fieldName.toLowerCase();

  if (key.includes('date')) {
    return parseDateCandidate(normalized) ? 0.78 : 0.52;
  }

  if (key.includes('citizenship_number') || key === 'nin' || key.includes('national_id')) {
    const digits = normalized.replace(/\D/g, '').length;
    if (digits >= 8) {
      return 0.86;
    }

    if (digits >= 6) {
      return 0.72;
    }

    return 0.5;
  }

  if (key.includes('name')) {
    const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
    return tokenCount >= 2 ? 0.74 : 0.62;
  }

  if (key.includes('district') || key.includes('address')) {
    return 0.68;
  }

  if (key.includes('photo') || key.includes('face') || key.includes('signature')) {
    return 0.58;
  }

  return 0.64;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function shouldReplaceExistingConfidence(extracted: ExtractedDocument): boolean {
  const existing = extracted.confidence;
  if (!existing) {
    return true;
  }

  const values = Object.values(existing.per_field ?? {}).filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value)
  );

  if (values.length === 0) {
    return true;
  }

  const first = values[0];
  const allEqual = values.every((value) => Math.abs(value - first) < 0.001);
  if (!allEqual) {
    return false;
  }

  return Math.abs(first - 0.35) < 0.001 || Math.abs(first - 0.3) < 0.001;
}

function enrichConfidence(extracted: ExtractedDocument): ExtractedDocument {
  const existingPerField = extracted.confidence?.per_field ?? {};
  const fieldsRecord = extracted.fields as Record<string, unknown>;
  const forceReplace = shouldReplaceExistingConfidence(extracted);

  const perField: Record<string, number> = {};
  for (const [fieldName, rawValue] of Object.entries(fieldsRecord)) {
    const existing = existingPerField[fieldName];
    if (!forceReplace && typeof existing === 'number' && Number.isFinite(existing)) {
      perField[fieldName] = clamp01(existing);
      continue;
    }

    const inferred = inferFieldConfidence(fieldName, rawValue);
    if (typeof inferred === 'number') {
      perField[fieldName] = clamp01(inferred);
    }
  }

  if (!forceReplace) {
    for (const [fieldName, value] of Object.entries(existingPerField)) {
      if (!(fieldName in perField) && typeof value === 'number' && Number.isFinite(value)) {
        perField[fieldName] = clamp01(value);
      }
    }
  }

  const existingOverall = extracted.confidence?.overall;
  const overall =
    !forceReplace && typeof existingOverall === 'number' && Number.isFinite(existingOverall)
      ? clamp01(existingOverall)
      : clamp01(average(Object.values(perField)));

  return {
    ...extracted,
    confidence: {
      overall,
      per_field: perField,
    },
  };
}

function collectDates(rawText: string): string[] {
  const matches = rawText.match(/\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/g) ?? [];
  const normalized = matches
    .map((item) => parseDateCandidate(item))
    .filter((item): item is string => Boolean(item));

  return [...new Set(normalized)];
}

function findLabeledDate(rawText: string, labels: string[]): string | null {
  const candidate = findLineValue(rawText, labels);
  if (!candidate) {
    return null;
  }

  const direct = parseDateCandidate(candidate);
  if (direct) {
    return direct;
  }

  const embedded = candidate.match(/\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/);
  if (!embedded?.[0]) {
    return null;
  }

  return parseDateCandidate(embedded[0]);
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
  const labeledDateOfBirth = findLabeledDate(rawText, ['date of birth', 'dob', 'birth date', 'जन्म मिति']);
  const labeledIssueDate = findLabeledDate(rawText, ['issue date', 'issued on', 'जारी मिति']);
  const dateOfBirth = labeledDateOfBirth ?? dates[0] ?? null;
  const issueDate = labeledIssueDate ?? dates.find((value) => value !== dateOfBirth) ?? null;
  const normalizedText = rawText.toLowerCase();
  const citizenshipKeywordDetected =
    /\b(citizenship|nagarikta|citizen)\b|नागरिकता/iu.test(rawText);
  const officialKeywordDetected =
    /\b(nepal|government|district|jilla|citizenship)\b|नेपाल|सरकार|जिल्ला/iu.test(rawText);
  const meaningfulLineCount = rawText
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter((line) => line.length >= 4).length;
  const probableFullDocument = meaningfulLineCount >= 6 || rawText.length >= 140;

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
    likely_citizenship_document:
      citizenshipKeywordDetected || Boolean(findCitizenshipNumber(normalizedText)) || undefined,
    document_title_present: citizenshipKeywordDetected || undefined,
    official_mark_detected: officialKeywordDetected || undefined,
    appears_full_document: probableFullDocument || undefined,
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
  const lowQuality = ['shadow', 'blur', 'dark', 'glare', 'multiple people', 'group']
    .some((token) => normalized.includes(token));

  return {
    document_type: 'PASSPORT_PHOTO',
    fields: {
      face_detected: faceDetected,
      face_centered: undefined,
      background_color: null,
      resolution_sufficient: lowQuality ? false : undefined,
      lighting_quality: lowQuality ? 'poor' : null,
      single_face: normalized.includes('group') || normalized.includes('multiple') ? false : undefined,
      head_covering_absent: undefined,
      eyes_visible: undefined,
      neutral_expression: undefined,
      glare_absent: normalized.includes('glare') ? false : undefined,
      shadows_absent: normalized.includes('shadow') ? false : undefined,
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
    'For boolean compliance checks, use true or false when reasonably inferable; otherwise null.',
    'Use confidence.overall and confidence.per_field values between 0 and 1.',
    'Use concise plain text for values.',
  ].join(' ');

  if (documentType === DocumentType.CITIZENSHIP) {
    return `${sharedRules} Output JSON schema: {"document_type":"CITIZENSHIP","fields":{"name_en":string|null,"name_ne":string|null,"citizenship_number":string|null,"date_of_birth":string|null,"issue_date":string|null,"issue_district":string|null,"father_name":string|null,"mother_name":string|null,"address":string|null,"photo_detected":boolean|null,"signature_detected":boolean|null,"likely_citizenship_document":boolean|null,"document_title_present":boolean|null,"official_mark_detected":boolean|null,"appears_full_document":boolean|null},"confidence":{"overall":number,"per_field":{"name_en":number,"name_ne":number,"citizenship_number":number,"date_of_birth":number,"issue_date":number,"issue_district":number,"father_name":number,"mother_name":number,"address":number,"photo_detected":number,"signature_detected":number,"likely_citizenship_document":number,"document_title_present":number,"official_mark_detected":number,"appears_full_document":number}},"raw_text":string}`;
  }

  if (documentType === DocumentType.PASSPORT_PHOTO) {
    return `${sharedRules} Output JSON schema: {"document_type":"PASSPORT_PHOTO","fields":{"face_detected":boolean|null,"face_centered":boolean|null,"background_color":string|null,"resolution_sufficient":boolean|null,"lighting_quality":string|null,"single_face":boolean|null,"head_covering_absent":boolean|null,"eyes_visible":boolean|null,"neutral_expression":boolean|null,"glare_absent":boolean|null,"shadows_absent":boolean|null},"confidence":{"overall":number,"per_field":{"face_detected":number,"face_centered":number,"background_color":number,"resolution_sufficient":number,"lighting_quality":number,"single_face":number,"head_covering_absent":number,"eyes_visible":number,"neutral_expression":number,"glare_absent":number,"shadows_absent":number}},"raw_text":string}`;
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

    return enrichConfidence(parsed.data);
  },
};
