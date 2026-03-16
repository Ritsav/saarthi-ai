import { describe, expect, it } from 'vitest';
import { DocumentType } from '@prisma/client';
import { autofillMapper } from './mapper';
import { portalDefinitions } from './portals';

describe('autofillMapper', () => {
  it('maps citizenship fields to passport selectors', () => {
    const portal = portalDefinitions.nepal_passport;

    const documents = [
      {
        id: 'doc-citizenship-1',
        document_type: DocumentType.CITIZENSHIP,
        ocr_result: {
          document_type: 'CITIZENSHIP',
          fields: {
            name_en: 'Nabin Budha',
            citizenship_number: '12-34-56-78901',
          },
          confidence: {
            overall: 0.95,
            per_field: {
              name_en: 0.96,
            },
          },
        },
        validation_result: {
          low_confidence_fields: [],
        },
      },
    ];

    const mapped = autofillMapper.mapPortalFields(portal, documents);

    const firstName = mapped.fields.find((field) => field.key === 'first_name');
    expect(firstName?.value).toBe('Nabin');
    expect(mapped.missingFields.length).toBeGreaterThanOrEqual(0);
  });

  it('reports missing required fields when source document absent', () => {
    const portal = portalDefinitions.nepal_passport;

    const mapped = autofillMapper.mapPortalFields(portal, []);

    expect(mapped.fields.length).toBeGreaterThan(0);
    expect(mapped.missingFields.length).toBeGreaterThan(0);
  });

  it('keeps selector fallback list for passport fields', () => {
    const portal = portalDefinitions.nepal_passport;
    const documents = [
      {
        id: 'doc-citizen-1',
        document_type: DocumentType.CITIZENSHIP,
        ocr_result: {
          document_type: 'CITIZENSHIP',
          fields: {
            name_en: 'Nabin Budha',
            name_ne: 'नबिन बुढा',
            citizenship_number: '12-34-56-78901',
            date_of_birth: '1998-10-09',
            issue_date: '2018-05-20',
            issue_district: 'Dolpa',
            father_name: 'Madan Budha',
            mother_name: 'Parbati Budha',
            address: 'Tripureshwor, Kathmandu',
          },
          confidence: {
            overall: 0.95,
            per_field: {},
          },
        },
        validation_result: {
          low_confidence_fields: [],
        },
      },
    ];

    const mapped = autofillMapper.mapPortalFields(portal, documents);
    const firstNameField = mapped.fields.find((field) => field.key === 'first_name');

    expect(firstNameField?.selector).toBe("[formcontrolname='firstName']");
    expect(firstNameField?.selectors?.length).toBeGreaterThan(1);
  });
});
