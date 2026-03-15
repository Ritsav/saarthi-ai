import { ProcessType } from '@prisma/client';
import { z } from 'zod';

export const portalKeySchema = z.enum([
  'camis_company',
  'ird_pan',
  'nepal_passport',
]);

export type PortalKey = z.infer<typeof portalKeySchema>;

export interface PortalFieldMapping {
  key: string;
  selector: string;
  source: string;
  required?: boolean;
}

export interface PortalDefinition {
  key: PortalKey;
  name: string;
  processType: ProcessType;
  urlPatterns: string[];
  fields: PortalFieldMapping[];
}

export const portalDefinitions: Record<PortalKey, PortalDefinition> = {
  camis_company: {
    key: 'camis_company',
    name: 'OCR CAMIS',
    processType: ProcessType.COMPANY_REGISTRATION,
    urlPatterns: ['https://camis.ocr.gov.np/*'],
    fields: [
      {
        key: 'director_name',
        selector: "input[name='directorName']",
        source: 'CITIZENSHIP.fields.name_en',
        required: true,
      },
      {
        key: 'director_citizenship_number',
        selector: "input[name='directorCitizenshipNumber']",
        source: 'CITIZENSHIP.fields.citizenship_number',
        required: true,
      },
      {
        key: 'director_address',
        selector: "input[name='directorAddress']",
        source: 'CITIZENSHIP.fields.address',
      },
      {
        key: 'director_father_name',
        selector: "input[name='directorFatherName']",
        source: 'CITIZENSHIP.fields.father_name',
      },
    ],
  },
  ird_pan: {
    key: 'ird_pan',
    name: 'IRD Taxpayer Portal',
    processType: ProcessType.PAN_REGISTRATION,
    urlPatterns: ['https://taxpayerportal.ird.gov.np/*', 'https://ird.gov.np/*'],
    fields: [
      {
        key: 'pan_number',
        selector: "input[name='panNumber']",
        source: 'PAN_CERTIFICATE.fields.pan_number',
        required: true,
      },
      {
        key: 'registered_name',
        selector: "input[name='registeredName']",
        source: 'PAN_CERTIFICATE.fields.registered_name',
        required: true,
      },
      {
        key: 'business_type',
        selector: "input[name='businessType']",
        source: 'PAN_CERTIFICATE.fields.business_type',
      },
      {
        key: 'registration_date',
        selector: "input[name='registrationDate']",
        source: 'PAN_CERTIFICATE.fields.registration_date',
      },
      {
        key: 'tax_office',
        selector: "input[name='taxOffice']",
        source: 'PAN_CERTIFICATE.fields.tax_office',
      },
    ],
  },
  nepal_passport: {
    key: 'nepal_passport',
    name: 'Nepal Passport Portal',
    processType: ProcessType.PASSPORT_APPLICATION,
    urlPatterns: ['https://nepalpassport.gov.np/*', 'https://epassport.immigration.gov.np/*'],
    fields: [
      {
        key: 'full_name_en',
        selector: "input[name='fullNameEnglish']",
        source: 'CITIZENSHIP.fields.name_en',
        required: true,
      },
      {
        key: 'full_name_ne',
        selector: "input[name='fullNameNepali']",
        source: 'CITIZENSHIP.fields.name_ne',
      },
      {
        key: 'citizenship_number',
        selector: "input[name='citizenshipNumber']",
        source: 'CITIZENSHIP.fields.citizenship_number',
        required: true,
      },
      {
        key: 'dob',
        selector: "input[name='dateOfBirth']",
        source: 'CITIZENSHIP.fields.date_of_birth',
      },
      {
        key: 'father_name',
        selector: "input[name='fatherName']",
        source: 'CITIZENSHIP.fields.father_name',
      },
      {
        key: 'address',
        selector: "input[name='permanentAddress']",
        source: 'CITIZENSHIP.fields.address',
      },
      {
        key: 'issue_district',
        selector: "input[name='issueDistrict']",
        source: 'CITIZENSHIP.fields.issue_district',
      },
    ],
  },
};

export function portalKeyFromProcessType(processType: ProcessType): PortalKey {
  if (processType === ProcessType.COMPANY_REGISTRATION) {
    return 'camis_company';
  }

  if (processType === ProcessType.PAN_REGISTRATION) {
    return 'ird_pan';
  }

  return 'nepal_passport';
}
