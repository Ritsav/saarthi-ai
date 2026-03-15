import { describe, expect, it } from 'vitest';
import { DocumentType } from '@prisma/client';
import { ocrValidator } from './validator';

describe('ocrValidator', () => {
  it('validates PAN certificate and flags invalid pan number', () => {
    const extracted = {
      document_type: 'PAN_CERTIFICATE' as const,
      fields: {
        pan_number: '12A456789',
        registered_name: 'Acme Pvt Ltd',
        business_type: 'IT Services',
        registration_date: '2024-01-20',
        tax_office: 'Kathmandu',
      },
      confidence: {
        overall: 0.92,
        per_field: {
          pan_number: 0.93,
        },
      },
      raw_text: 'sample',
    };

    const result = ocrValidator.validate(DocumentType.PAN_CERTIFICATE, extracted);

    expect(result.is_valid).toBe(false);
    expect(result.fields_invalid).toContain('pan_number');
    expect(result.suggestions.some((item) => item.includes('9 digits'))).toBe(true);
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
});
