import { DocumentType } from '@prisma/client';
import { AppError } from '../../utils/errors';
import type { PortalDefinition } from './portals';

interface SourceDocumentSnapshot {
  id: string;
  document_type: DocumentType;
  ocr_result: unknown;
  validation_result: unknown;
}

export interface MappedField {
  key: string;
  selector: string;
  value: string;
  sourceDocumentId?: string;
  confidence?: number;
}

export interface MappingResult {
  fields: MappedField[];
  missingFields: string[];
  warnings: string[];
}

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

function findDocumentForSource(
  documents: SourceDocumentSnapshot[],
  sourceDocumentType: DocumentType
): SourceDocumentSnapshot | null {
  return documents.find((document) => document.document_type === sourceDocumentType) ?? null;
}

export const autofillMapper = {
  mapPortalFields(portal: PortalDefinition, documents: SourceDocumentSnapshot[]): MappingResult {
    const fields: MappedField[] = [];
    const missingFields: string[] = [];
    const warnings: string[] = [];

    for (const mapping of portal.fields) {
      const [documentTypeName, ...pathParts] = mapping.source.split('.');
      const sourceType = DocumentType[documentTypeName as keyof typeof DocumentType];

      if (!sourceType) {
        throw new AppError(500, 'AUTOFILL_SOURCE_CONFIG_INVALID', `Invalid source mapping: ${mapping.source}`);
      }

      const sourceDocument = findDocumentForSource(documents, sourceType);
      if (!sourceDocument) {
        if (mapping.required) {
          missingFields.push(mapping.selector);
        }
        continue;
      }

      const path = pathParts.join('.');
      const rawValue = readValueByPath(sourceDocument.ocr_result, path);
      const value = asNonEmptyString(rawValue);

      if (!value) {
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

      fields.push({
        key: mapping.key,
        selector: mapping.selector,
        value,
        sourceDocumentId: sourceDocument.id,
        confidence: typeof confidenceValue === 'number' ? confidenceValue : undefined,
      });
    }

    return {
      fields,
      missingFields,
      warnings,
    };
  },
};
