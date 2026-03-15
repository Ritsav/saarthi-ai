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
  selectors?: string[];
  source: string;
  required?: boolean;
  transform?: 'identity' | 'first_token' | 'rest_tokens';
}

export interface PortalDefinition {
  key: PortalKey;
  name: string;
  processType: ProcessType;
  urlPatterns: string[];
  fields: PortalFieldMapping[];
  manualSteps?: string[];
  formSelectorPlan?: Array<{
    step: string;
    mode: 'auto' | 'manual' | 'mixed';
    selectors: string[];
    notes?: string;
  }>;
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
        key: 'first_name',
        selector: "[formcontrolname='firstName']",
        selectors: ["[formcontrolname='firstName']", "input[name='firstName']"],
        source: 'CITIZENSHIP.fields.name_en',
        required: true,
        transform: 'first_token',
      },
      {
        key: 'last_name',
        selector: "[formcontrolname='lastName']",
        selectors: ["[formcontrolname='lastName']", "input[name='lastName']"],
        source: 'CITIZENSHIP.fields.name_en',
        required: true,
        transform: 'rest_tokens',
      },
      {
        key: 'citizenship_number',
        selector: "[formcontrolname='citizenNum']",
        selectors: ["[formcontrolname='citizenNum']", "input[name='citizenNum']"],
        source: 'CITIZENSHIP.fields.citizenship_number',
        required: true,
      },
      {
        key: 'date_of_birth',
        selector: "[formcontrolname='dateOfBirth']",
        selectors: ["[formcontrolname='dateOfBirth']", "input[name='dateOfBirth']"],
        source: 'CITIZENSHIP.fields.date_of_birth',
      },
      {
        key: 'citizenship_issue_district',
        selector: "[formcontrolname='citizenIssuePlaceDistrict']",
        selectors: ["[formcontrolname='citizenIssuePlaceDistrict']", "[name='citizenIssuePlaceDistrict']"],
        source: 'CITIZENSHIP.fields.issue_district',
      },
      {
        key: 'father_first_name',
        selector: "[formcontrolname='fatherFirstName']",
        selectors: ["[formcontrolname='fatherFirstName']", "input[name='fatherFirstName']"],
        source: 'CITIZENSHIP.fields.father_name',
        transform: 'first_token',
      },
      {
        key: 'father_last_name',
        selector: "[formcontrolname='fatherLastName']",
        selectors: ["[formcontrolname='fatherLastName']", "input[name='fatherLastName']"],
        source: 'CITIZENSHIP.fields.father_name',
        transform: 'rest_tokens',
      },
      {
        key: 'mother_first_name',
        selector: "[formcontrolname='motherFirstName']",
        selectors: ["[formcontrolname='motherFirstName']", "input[name='motherFirstName']"],
        source: 'CITIZENSHIP.fields.mother_name',
        transform: 'first_token',
      },
      {
        key: 'mother_last_name',
        selector: "[formcontrolname='motherLastName']",
        selectors: ["[formcontrolname='motherLastName']", "input[name='motherLastName']"],
        source: 'CITIZENSHIP.fields.mother_name',
        transform: 'rest_tokens',
      },
      {
        key: 'main_address_street',
        selector: "[formcontrolname='mainAddressStreetVillage']",
        selectors: ["[formcontrolname='mainAddressStreetVillage']", "input[name='mainAddressStreetVillage']"],
        source: 'CITIZENSHIP.fields.address',
      },
      {
        key: 'contact_street',
        selector: "[formcontrolname='contactStreetVillage']",
        selectors: ["[formcontrolname='contactStreetVillage']", "input[name='contactStreetVillage']"],
        source: 'CITIZENSHIP.fields.address',
      },
      {
        key: 'nin',
        selector: "[formcontrolname='nin']",
        selectors: ["[formcontrolname='nin']", "input[name='nin']"],
        source: 'PAN_CERTIFICATE.fields.pan_number',
      },
    ],
    manualSteps: [
      'Step 1: Select passport type radio manually (`#PP` for Ordinary 34 pages is common).',
      'Step 2: Appointment country/province/district/location/timeslot are dynamic and must be selected manually.',
      "Step 4 (guessed): Set major/minor radio manually (likely field around `isMinor` or labels 'Major'/'Minor').",
      "Step 4 (guessed): Upload citizenship front/back images manually via file inputs (likely `input[type='file']`).",
      'Final step: complete captcha manually and click submit.',
    ],
    formSelectorPlan: [
      {
        step: 'Form 1 - Passport type selection',
        mode: 'manual',
        selectors: ['#PP', '#PB', '#PS', '#PD', '#PG', '#PT', '#PN'],
        notes: 'Choose one passport type, then click Proceed.',
      },
      {
        step: 'Form 2 - Appointment booking',
        mode: 'manual',
        selectors: ['#mat-select-0', '#mat-select-1', '#mat-select-2', '#mat-select-3'],
        notes: 'Country/province/district/location/timeslot are dynamic and often require manual selection.',
      },
      {
        step: 'Form 3 - Personal and citizenship details',
        mode: 'auto',
        selectors: [
          "[formcontrolname='firstName']",
          "[formcontrolname='lastName']",
          "[formcontrolname='dateOfBirth']",
          "[formcontrolname='citizenNum']",
          "[formcontrolname='citizenIssuePlaceDistrict']",
          "[formcontrolname='fatherFirstName']",
          "[formcontrolname='fatherLastName']",
          "[formcontrolname='motherFirstName']",
          "[formcontrolname='motherLastName']",
          "[formcontrolname='mainAddressStreetVillage']",
          "[formcontrolname='contactStreetVillage']",
          "[formcontrolname='nin']",
        ],
        notes: 'Autofill targets these fields; date and district may still need manual correction based on input format/options.',
      },
      {
        step: 'Form 4 - Major/minor and uploads (guessed)',
        mode: 'mixed',
        selectors: [
          "input[type='radio'][formcontrolname='isMinor']",
          "input[type='file'][formcontrolname='citizenshipFront']",
          "input[type='file'][formcontrolname='citizenshipBack']",
        ],
        notes: 'Radio often manual; file upload is attempted by extension and may need manual fallback.',
      },
      {
        step: 'Form 5 - Summary and submit',
        mode: 'manual',
        selectors: ["input[name*='captcha']", "[id*='captcha']", "button[type='submit']"],
        notes: 'Captcha and final submit are always manual.',
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
