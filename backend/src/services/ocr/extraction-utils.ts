import { DocumentType } from '@prisma/client';
import { AppError } from '../../utils/errors';

type UnknownRecord = Record<string, unknown>;

const DEVANAGARI_DIGITS: Record<string, string> = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function normalizeDigits(value: string): string {
  return value.replace(/[०-९]/g, (char) => DEVANAGARI_DIGITS[char] ?? char);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeWhitespace(normalizeDigits(value));
  return normalized.length > 0 ? normalized : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
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

function parseBooleanish(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  if (typeof value === 'string') {
    const normalized = normalizeWhitespace(value).toLowerCase();
    if (['true', 'yes', 'y', '1', 'detected', 'present'].includes(normalized)) {
      return true;
    }

    if (['false', 'no', 'n', '0', 'not detected', 'absent'].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function parseDateComponents(value: string): { year: number; month: number; day: number } | null {
  const normalized = normalizeDigits(value).trim();

  let match = normalized.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const [, year, month, day] = match;
    return { year: Number(year), month: Number(month), day: Number(day) };
  }

  match = normalized.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return { year: Number(year), month: Number(month), day: Number(day) };
  }

  return null;
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = normalizeDigits(value).trim();
  const direct = parseDateComponents(normalized);
  const embedded =
    normalized.match(/\b(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/)?.[0] ??
    null;
  const components = direct ?? (embedded ? parseDateComponents(embedded) : null);

  if (!components || !isValidDateParts(components.year, components.month, components.day)) {
    return null;
  }

  const yyyy = String(components.year);
  const mm = String(components.month).padStart(2, '0');
  const dd = String(components.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeConfidence(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) {
    return undefined;
  }

  const overallRaw = parseNumber(record.overall);
  const perFieldRaw = asRecord(record.per_field);

  const perField: Record<string, number> = {};
  if (perFieldRaw) {
    for (const [key, fieldValue] of Object.entries(perFieldRaw)) {
      const parsed = parseNumber(fieldValue);
      if (parsed !== null) {
        perField[key] = clamp01(parsed);
      }
    }
  }

  if (overallRaw === null && Object.keys(perField).length === 0) {
    return undefined;
  }

  return {
    overall: clamp01(overallRaw ?? 0),
    per_field: perField,
  };
}

function normalizeCitizenshipPayload(record: UnknownRecord): UnknownRecord {
  const fields = asRecord(record.fields) ?? {};

  return {
    document_type: 'CITIZENSHIP',
    fields: {
      name_en: normalizeText(fields.name_en),
      name_ne: normalizeText(fields.name_ne),
      citizenship_number: normalizeText(fields.citizenship_number)?.replace(/\s+/g, '') ?? null,
      date_of_birth: normalizeDate(fields.date_of_birth),
      issue_date: normalizeDate(fields.issue_date),
      issue_district: normalizeText(fields.issue_district),
      father_name: normalizeText(fields.father_name),
      mother_name: normalizeText(fields.mother_name),
      address: normalizeText(fields.address),
      photo_detected: parseBooleanish(fields.photo_detected),
      signature_detected: parseBooleanish(fields.signature_detected),
      likely_citizenship_document: parseBooleanish(fields.likely_citizenship_document),
      document_title_present: parseBooleanish(fields.document_title_present),
      official_mark_detected: parseBooleanish(fields.official_mark_detected),
      appears_full_document: parseBooleanish(fields.appears_full_document),
    },
    confidence: normalizeConfidence(record.confidence),
    raw_text: normalizeText(record.raw_text) ?? undefined,
  };
}

function normalizePassportPhotoPayload(record: UnknownRecord): UnknownRecord {
  const fields = asRecord(record.fields) ?? {};

  return {
    document_type: 'PASSPORT_PHOTO',
    fields: {
      face_detected: parseBooleanish(fields.face_detected),
      face_centered: parseBooleanish(fields.face_centered),
      background_color: normalizeText(fields.background_color),
      resolution_sufficient: parseBooleanish(fields.resolution_sufficient),
      lighting_quality: normalizeText(fields.lighting_quality),
      single_face: parseBooleanish(fields.single_face),
      head_covering_absent: parseBooleanish(fields.head_covering_absent),
      eyes_visible: parseBooleanish(fields.eyes_visible),
      neutral_expression: parseBooleanish(fields.neutral_expression),
      glare_absent: parseBooleanish(fields.glare_absent),
      shadows_absent: parseBooleanish(fields.shadows_absent),
    },
    confidence: normalizeConfidence(record.confidence),
    raw_text: normalizeText(record.raw_text) ?? undefined,
  };
}

function extractBalancedJSONObject(content: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      if (start === -1) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (char === '}') {
      if (depth > 0) {
        depth -= 1;
      }
      if (start !== -1 && depth === 0) {
        return content.slice(start, index + 1);
      }
    }
  }

  return null;
}

function unwrapPotentialPayload(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) {
    return value;
  }

  if (typeof record.document_type === 'string') {
    return value;
  }

  const nestedKeys = ['data', 'result', 'payload', 'extraction', 'output'];
  for (const key of nestedKeys) {
    const nested = asRecord(record[key]);
    if (nested && typeof nested.document_type === 'string') {
      return nested;
    }
  }

  return value;
}

function candidateJsonStrings(content: string): string[] {
  const candidates: string[] = [];
  const trimmed = content.trim();
  if (trimmed.length > 0) {
    candidates.push(trimmed);
  }

  const fencedRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null = fencedRegex.exec(content);
  while (match) {
    if (match[1]?.trim()) {
      candidates.push(match[1].trim());
    }
    match = fencedRegex.exec(content);
  }

  const balanced = extractBalancedJSONObject(content);
  if (balanced) {
    candidates.push(balanced.trim());
  }

  return candidates;
}

export function parseJsonObjectFromLLM(content: string): unknown {
  const candidates = candidateJsonStrings(content);
  for (const candidate of candidates) {
    try {
      return unwrapPotentialPayload(JSON.parse(candidate));
    } catch {
      // Try next candidate
    }
  }

  throw new AppError(502, 'EXTRACTION_INVALID_JSON', 'LLM did not return valid JSON');
}

export function normalizeExtractionPayload(raw: unknown, documentType: DocumentType): unknown {
  const record = asRecord(raw);
  if (!record) {
    return raw;
  }

  if (documentType === DocumentType.CITIZENSHIP) {
    return normalizeCitizenshipPayload(record);
  }

  if (documentType === DocumentType.PASSPORT_PHOTO) {
    return normalizePassportPhotoPayload(record);
  }

  return raw;
}
