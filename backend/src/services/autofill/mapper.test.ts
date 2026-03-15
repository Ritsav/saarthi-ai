import { describe, expect, it } from 'vitest';
import { DocumentType, ProcessType } from '@prisma/client';
import { autofillMapper } from './mapper';
import { portalDefinitions } from './portals';

describe('autofillMapper', () => {
  it('maps PAN certificate fields to IRD selectors', () => {
    const portal = portalDefinitions.ird_pan;

    const documents = [
      {
        id: 'doc-pan-1',
        document_type: DocumentType.PAN_CERTIFICATE,
        ocr_result: {
          document_type: 'PAN_CERTIFICATE',
          fields: {
            pan_number: '123456789',
            registered_name: 'Acme Pvt Ltd',
            business_type: 'IT',
            registration_date: '2024-01-01',
            tax_office: 'Kathmandu',
          },
          confidence: {
            overall: 0.95,
            per_field: {
              pan_number: 0.96,
            },
          },
        },
        validation_result: {
          low_confidence_fields: [],
        },
      },
    ];

    const mapped = autofillMapper.mapPortalFields(portal, documents);

    const panField = mapped.fields.find((field) => field.key === 'pan_number');
    expect(panField?.value).toBe('123456789');
    expect(mapped.missingFields.length).toBe(0);
  });

  it('reports missing required fields when source document absent', () => {
    const portal = portalDefinitions.nepal_passport;

    const mapped = autofillMapper.mapPortalFields(portal, []);

    expect(mapped.fields.length).toBe(0);
    expect(mapped.missingFields.length).toBeGreaterThan(0);
  });
});
