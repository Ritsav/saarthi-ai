import { DocumentType } from '@prisma/client';
import { AppError } from '../../utils/errors';
import type { PortalDefinition } from './portals';

interface SourceDocumentSnapshot {
  id: string;
  document_type: DocumentType;
  ocr_result: unknown;
  validation_result: unknown;
}

export interface UserProfileDefaults {
  email: string;
  contact_number: string | null;
  home_phone: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

export interface MappedField {
  key: string;
  selector: string;
  selectors?: string[];
  value: string;
  fieldType?: 'text' | 'date' | 'radio' | 'select';
  options?: Array<{
    value: string;
    label: string;
    selector?: string;
  }>;
  approvalRequired?: boolean;
  formStep?: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
  sectionTitle?: string;
  sourceDocumentId?: string;
  confidence?: number;
}

export interface MappingResult {
  fields: MappedField[];
  missingFields: string[];
  warnings: string[];
}

const EMERGENCY_CONTACT_FIELD_KEYS = new Set([
  'contact_first_name',
  'contact_last_name',
  'contact_district',
  'contact_street',
  'contact_house_number',
  'contact_ward',
  'contact_phone',
  'contact_email',
  'contact_province',
  'contact_municipality',
]);

const MANUAL_REVIEW_FIELD_KEYS = new Set(['nin']);

function readValueByPath(source: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = source;

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitName(value: string): { first: string; rest: string } {
  const parts = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (parts.length === 0) {
    return { first: '', rest: '' };
  }

  if (parts.length === 1) {
    return { first: parts[0], rest: parts[0] };
  }

  return {
    first: parts[0],
    rest: parts.slice(1).join(' '),
  };
}

function applyTransform(
  value: string,
  transform: 'identity' | 'first_token' | 'rest_tokens' | undefined
): string | null {
  if (!transform || transform === 'identity') {
    return value;
  }

  const split = splitName(value);
  if (transform === 'first_token') {
    return split.first || null;
  }

  if (transform === 'rest_tokens') {
    return split.rest || split.first || null;
  }

  return value;
}

function getLowConfidenceFieldSet(validationResult: unknown): Set<string> {
  if (!validationResult || typeof validationResult !== 'object' || Array.isArray(validationResult)) {
    return new Set();
  }

  const value = (validationResult as Record<string, unknown>).low_confidence_fields;
  if (!Array.isArray(value)) {
    return new Set();
  }

  const fields = value.filter((item): item is string => typeof item === 'string');
  return new Set(fields);
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

function normalizeConfidence(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }

  return clamp01(value);
}

function inferConfidenceFromValue(fieldKey: string, value: string): number {
  const key = fieldKey.toLowerCase();
  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }

  if (key.includes('date')) {
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? 0.8 : 0.62;
  }

  if (key.includes('citizenship') || key === 'nin' || key.includes('number')) {
    const digits = normalized.replace(/\D/g, '').length;
    if (digits >= 8) {
      return 0.84;
    }

    if (digits >= 6) {
      return 0.72;
    }

    return 0.55;
  }

  if (key.includes('name')) {
    const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
    return tokenCount >= 2 ? 0.76 : 0.66;
  }

  if (key.includes('district') || key.includes('address') || key.includes('street')) {
    return 0.68;
  }

  return 0.64;
}

function deriveMappedConfidence(params: {
  mappingKey: string;
  sourceFieldName: string;
  value: string;
  confidenceValue: unknown;
  lowConfidenceSet: Set<string>;
}): number {
  const raw = normalizeConfidence(params.confidenceValue);
  const looksLikeFallback = typeof raw === 'number' && (Math.abs(raw - 0.35) < 0.001 || Math.abs(raw - 0.3) < 0.001);
  const inferred = inferConfidenceFromValue(params.mappingKey, params.value);

  let confidence =
    typeof raw === 'number' && !looksLikeFallback
      ? raw
      : inferred;

  if (params.lowConfidenceSet.has(params.sourceFieldName)) {
    confidence = Math.min(confidence, 0.55);
  }

  return clamp01(confidence);
}

function findDocumentForSource(
  documents: SourceDocumentSnapshot[],
  sourceDocumentType: DocumentType
): SourceDocumentSnapshot | null {
  return documents.find((document) => document.document_type === sourceDocumentType) ?? null;
}

function getProfileFallbackValue(key: string, profile?: UserProfileDefaults): string | null {
  if (!profile) {
    return null;
  }

  const normalized = key.trim().toLowerCase();

  if (normalized === 'email') {
    return asNonEmptyString(profile.email) ?? asNonEmptyString(profile.contact_email);
  }

  if (normalized === 'contact_email') {
    return asNonEmptyString(profile.contact_email) ?? asNonEmptyString(profile.email);
  }

  if (normalized === 'home_phone') {
    return (
      asNonEmptyString(profile.home_phone) ??
      asNonEmptyString(profile.contact_number) ??
      asNonEmptyString(profile.contact_phone)
    );
  }

  if (normalized === 'contact_phone') {
    return (
      asNonEmptyString(profile.contact_phone) ??
      asNonEmptyString(profile.contact_number) ??
      asNonEmptyString(profile.home_phone)
    );
  }

  if (normalized === 'contact_number') {
    return (
      asNonEmptyString(profile.contact_number) ??
      asNonEmptyString(profile.contact_phone) ??
      asNonEmptyString(profile.home_phone)
    );
  }

  return null;
}

export const autofillMapper = {
  mapPortalFields(
    portal: PortalDefinition,
    documents: SourceDocumentSnapshot[],
    profileDefaults?: UserProfileDefaults
  ): MappingResult {
    const fields: MappedField[] = [];
    const missingFields: string[] = [];
    const warnings: string[] = [];

    for (const mapping of portal.fields) {
      if (!mapping.source) {
        const profileFallbackValue = getProfileFallbackValue(mapping.key, profileDefaults);

        if (profileFallbackValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: profileFallbackValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
          });
          continue;
        }

        if (mapping.defaultValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: mapping.defaultValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
          });
        } else if (mapping.required) {
          missingFields.push(mapping.selector);
        }
        continue;
      }

      const [documentTypeName, ...pathParts] = mapping.source.split('.');
      const sourceType =
        mapping.sourceDocumentType ??
        DocumentType[documentTypeName as keyof typeof DocumentType];

      if (!sourceType) {
        throw new AppError(500, 'AUTOFILL_SOURCE_CONFIG_INVALID', `Invalid source mapping: ${mapping.source}`);
      }

      const sourceDocument = findDocumentForSource(documents, sourceType);
      if (!sourceDocument) {
        const profileFallbackValue = getProfileFallbackValue(mapping.key, profileDefaults);

        if (profileFallbackValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: profileFallbackValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
          });
          continue;
        }

        if (mapping.required && !mapping.defaultValue) {
          missingFields.push(mapping.selector);
        }

        if (mapping.defaultValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: mapping.defaultValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
          });
        }
        continue;
      }

      const path = pathParts.join('.');
      const rawValue = readValueByPath(sourceDocument.ocr_result, path);
      const sourceValue = asNonEmptyString(rawValue);
      const value = sourceValue
        ? applyTransform(sourceValue, mapping.transform)
        : null;

      if (!value) {
        const profileFallbackValue = getProfileFallbackValue(mapping.key, profileDefaults);
        if (profileFallbackValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: profileFallbackValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
            sourceDocumentId: sourceDocument.id,
          });
          continue;
        }

        if (mapping.defaultValue) {
          fields.push({
            key: mapping.key,
            selector: mapping.selector,
            selectors: mapping.selectors,
            value: mapping.defaultValue,
            fieldType: mapping.fieldType,
            options: mapping.options,
            approvalRequired: mapping.approvalRequired,
            formStep: mapping.formStep,
            sectionTitle: mapping.sectionTitle,
            sourceDocumentId: sourceDocument.id,
          });
          continue;
        }

        if (mapping.required) {
          missingFields.push(mapping.selector);
        }
        continue;
      }

      if (EMERGENCY_CONTACT_FIELD_KEYS.has(mapping.key)) {
        warnings.push(`Manual review required for ${mapping.key} (do not auto-copy applicant data)`);
        if (mapping.required) {
          missingFields.push(mapping.selector);
        }
        continue;
      }

      if (MANUAL_REVIEW_FIELD_KEYS.has(mapping.key)) {
        warnings.push(`Manual review required for ${mapping.key}`);
        if (mapping.required) {
          missingFields.push(mapping.selector);
        }
        continue;
      }

      const fieldName = path.split('.').pop() ?? path;
      const lowConfidenceSet = getLowConfidenceFieldSet(sourceDocument.validation_result);

      if (lowConfidenceSet.has(fieldName)) {
        warnings.push(`Low confidence for ${mapping.key}`);
      }

      const confidencePath = `confidence.per_field.${fieldName}`;
      const confidenceValue = readValueByPath(sourceDocument.ocr_result, confidencePath);
      const confidence = deriveMappedConfidence({
        mappingKey: mapping.key,
        sourceFieldName: fieldName,
        value,
        confidenceValue,
        lowConfidenceSet,
      });

      fields.push({
        key: mapping.key,
        selector: mapping.selector,
        selectors: mapping.selectors,
        value,
        fieldType: mapping.fieldType,
        options: mapping.options,
        approvalRequired: mapping.approvalRequired,
        formStep: mapping.formStep,
        sectionTitle: mapping.sectionTitle,
        sourceDocumentId: sourceDocument.id,
        confidence,
      });
    }

    return {
      fields,
      missingFields,
      warnings,
    };
  },
};
