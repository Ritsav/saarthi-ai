import { describe, expect, it } from 'vitest';
import { DocumentType } from '@prisma/client';
import { ocrValidator } from './validator';

describe('ocrValidator', () => {
  it('validates passport photo and flags missing face', () => {
    const extracted = {
      document_type: 'PASSPORT_PHOTO' as const,
      fields: {
        face_detected: false,
        face_centered: true,
        background_color: 'blue',
        resolution_sufficient: true,
        lighting_quality: 'good',
      },
      confidence: {
        overall: 0.92,
        per_field: {
          face_detected: 0.93,
        },
      },
      raw_text: 'sample',
    };

    const result = ocrValidator.validate(DocumentType.PASSPORT_PHOTO, extracted);

    expect(result.is_valid).toBe(false);
    expect(result.fields_invalid).toContain('face_detected');
    expect(result.suggestions.some((item) => item.includes('face'))).toBe(true);
  });

  it('validates citizenship with missing required identifier', () => {
    const extracted = {
      document_type: 'CITIZENSHIP' as const,
      fields: {
        name_en: 'Ram Bahadur',
        name_ne: 'राम बहादुर',
        citizenship_number: null,
        date_of_birth: '1990-05-20',
        issue_date: '2010-04-10',
        issue_district: 'Kathmandu',
        father_name: 'Hari',
        mother_name: null,
        address: 'KTM',
        photo_detected: true,
        signature_detected: true,
      },
      confidence: {
        overall: 0.9,
        per_field: {},
      },
      raw_text: 'sample',
    };

    const result = ocrValidator.validate(DocumentType.CITIZENSHIP, extracted);

    expect(result.is_valid).toBe(false);
    expect(result.fields_missing).toContain('citizenship_number');
  });

  it('flags citizenship number and timeline anomalies', () => {
    const extracted = {
      document_type: 'CITIZENSHIP' as const,
      fields: {
        name_en: 'Sita Nepali',
        name_ne: null,
        citizenship_number: '12-3',
        date_of_birth: '2010-01-01',
        issue_date: '2009-01-01',
        issue_district: 'Kathmandu',
        father_name: 'Hari',
        mother_name: null,
        address: 'KTM',
        photo_detected: true,
        signature_detected: true,
      },
      confidence: {
        overall: 0.9,
        per_field: {},
      },
      raw_text: 'sample',
    };

    const result = ocrValidator.validate(DocumentType.CITIZENSHIP, extracted);

    expect(result.is_valid).toBe(false);
    expect(result.fields_invalid).toContain('citizenship_number');
    expect(result.fields_invalid).toContain('issue_date');
    expect(result.warnings.some((item) => item.includes('Issue date'))).toBe(true);
  });
});
