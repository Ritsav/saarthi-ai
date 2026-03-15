import { describe, expect, it } from 'vitest';
import { DocumentType } from '@prisma/client';
import { AppError } from '../../utils/errors';
import { normalizeExtractionPayload, parseJsonObjectFromLLM } from './extraction-utils';

describe('extraction-utils', () => {
  it('parses JSON inside fenced markdown', () => {
    const content = [
      'Here is the result:',
      '```json',
      '{"document_type":"CITIZENSHIP","fields":{"name_en":"Nabin"}}',
      '```',
    ].join('\n');

    const parsed = parseJsonObjectFromLLM(content) as { document_type: string };
    expect(parsed.document_type).toBe('CITIZENSHIP');
  });

  it('unwraps payload from data envelope', () => {
    const content = JSON.stringify({
      data: {
        document_type: 'PASSPORT_PHOTO',
        fields: {
          face_detected: true,
        },
      },
    });

    const parsed = parseJsonObjectFromLLM(content) as { document_type: string };
    expect(parsed.document_type).toBe('PASSPORT_PHOTO');
  });

  it('normalizes citizenship payload values', () => {
    const raw = {
      document_type: 'CITIZENSHIP',
      fields: {
        name_en: '  Nabin   Budha  ',
        citizenship_number: '१२-३४ ५६',
        date_of_birth: '09/10/1998',
        issue_date: '2018/05/20',
        photo_detected: 'yes',
        signature_detected: 'no',
      },
      confidence: {
        overall: '1.2',
        per_field: {
          name_en: '0.9',
          citizenship_number: '-0.5',
        },
      },
      raw_text: '  sample text  ',
    };

    const normalized = normalizeExtractionPayload(raw, DocumentType.CITIZENSHIP) as any;
    expect(normalized.fields.name_en).toBe('Nabin Budha');
    expect(normalized.fields.citizenship_number).toBe('12-3456');
    expect(normalized.fields.date_of_birth).toBe('1998-10-09');
    expect(normalized.fields.issue_date).toBe('2018-05-20');
    expect(normalized.fields.photo_detected).toBe(true);
    expect(normalized.fields.signature_detected).toBe(false);
    expect(normalized.confidence.overall).toBe(1);
    expect(normalized.confidence.per_field.citizenship_number).toBe(0);
  });

  it('throws AppError for invalid JSON', () => {
    try {
      parseJsonObjectFromLLM('not json at all');
      throw new Error('Expected parse failure');
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('EXTRACTION_INVALID_JSON');
    }
  });
});
