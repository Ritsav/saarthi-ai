import { DocumentType } from '@prisma/client';
import type {
  CitizenshipExtraction,
  ExtractedDocument,
  PassportPhotoExtraction,
} from '../../schemas/extracted.schema';

interface ValidationResult {
  is_valid: boolean;
  readiness_score: number;
  fields_present: string[];
  fields_missing: string[];
  fields_invalid: string[];
  low_confidence_fields: string[];
  compliance_failures: string[];
  warnings: string[];
  suggestions: string[];
}

function isProvided(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return value !== null && value !== undefined;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map((item) => Number(item));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseIsoDate(value: string): Date | null {
  if (!isValidDate(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map((item) => Number(item));
  return new Date(Date.UTC(year, month - 1, day));
}

function citizenshipNumberHasEnoughDigits(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 6;
}

function getFieldConfidence(extracted: ExtractedDocument, fieldName: string): number {
  return extracted.confidence?.per_field?.[fieldName] ?? extracted.confidence?.overall ?? 0;
}

function collectLowConfidenceFields(extracted: ExtractedDocument, fields: string[]): string[] {
  return fields.filter((field) => getFieldConfidence(extracted, field) > 0 && getFieldConfidence(extracted, field) < 0.75);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function hasCitizenshipKeyword(rawText: string | undefined): boolean {
  if (!rawText) {
    return false;
  }

  return /\b(citizenship|nagarikta|citizen)\b|नागरिकता/iu.test(rawText);
}

function isPassportBackgroundAcceptable(background: string): boolean {
  const normalized = background.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  if (normalized.includes('blue') || normalized.includes('red') || normalized.includes('black')) {
    return false;
  }

  return (
    normalized.includes('white') ||
    normalized.includes('off-white') ||
    normalized.includes('off white') ||
    normalized.includes('light') ||
    normalized.includes('cream')
  );
}

function isLightingClearlyPoor(value: string): boolean {
  const normalized = value.toLowerCase();
  return ['poor', 'dark', 'dim', 'harsh', 'uneven', 'backlit', 'shadow'].some((item) =>
    normalized.includes(item)
  );
}

function calculateReadinessScore(required: string[], recommended: string[], present: Set<string>): number {
  const maxScore = required.length * 2 + recommended.length;
  if (maxScore === 0) {
    return 0;
  }

  let earned = 0;

  for (const field of required) {
    if (present.has(field)) {
      earned += 2;
    }
  }

  for (const field of recommended) {
    if (present.has(field)) {
      earned += 1;
    }
  }

  return Math.round((earned / maxScore) * 100);
}

function validateCitizenship(extracted: CitizenshipExtraction): ValidationResult {
  const fields = extracted.fields;
  const required = ['citizenship_number'];
  const recommended = [
    'name_en',
    'name_ne',
    'date_of_birth',
    'issue_date',
    'issue_district',
    'father_name',
    'address',
    'likely_citizenship_document',
    'document_title_present',
    'official_mark_detected',
    'appears_full_document',
  ];

  const present = new Set<string>();
  const missing: string[] = [];
  const invalid: string[] = [];
  const complianceFailures: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const field of [...required, ...recommended]) {
    const value = fields[field as keyof typeof fields];
    if (isProvided(value)) {
      present.add(field);
    }
  }

  for (const field of required) {
    if (!present.has(field)) {
      missing.push(field);
    }
  }

  if (fields.date_of_birth && !isValidDate(fields.date_of_birth)) {
    invalid.push('date_of_birth');
  }

  if (fields.issue_date && !isValidDate(fields.issue_date)) {
    invalid.push('issue_date');
  }

  if (fields.citizenship_number && !citizenshipNumberHasEnoughDigits(fields.citizenship_number)) {
    invalid.push('citizenship_number');
    suggestions.push('Citizenship number appears incomplete. Verify the full number.');
    complianceFailures.push('Citizenship number format appears incomplete or unreadable');
  }

  const dob = fields.date_of_birth ? parseIsoDate(fields.date_of_birth) : null;
  const issueDate = fields.issue_date ? parseIsoDate(fields.issue_date) : null;
  const today = new Date();

  if (dob && dob.getTime() > today.getTime()) {
    invalid.push('date_of_birth');
  }

  if (issueDate && issueDate.getTime() > today.getTime()) {
    invalid.push('issue_date');
  }

  if (dob && issueDate && issueDate.getTime() < dob.getTime()) {
    invalid.push('issue_date');
    warnings.push('Issue date appears earlier than date of birth');
  }

  const identityFieldsPresent = [fields.name_en, fields.name_ne, fields.date_of_birth, fields.issue_district]
    .filter((value) => typeof value === 'string' && value.trim().length > 0).length;
  if (identityFieldsPresent < 2) {
    invalid.push('document_authenticity');
    warnings.push('Too few citizenship identity fields were detected');
    suggestions.push('Upload a clearer full citizenship document with all text visible.');
    complianceFailures.push('Document does not show enough citizenship details');
  }

  if (fields.likely_citizenship_document === false) {
    invalid.push('likely_citizenship_document');
    suggestions.push('This file does not appear to be a citizenship certificate. Upload the official citizenship card/document.');
    complianceFailures.push('Uploaded file appears to be a non-citizenship document');
  }

  const authenticitySignals = [
    fields.likely_citizenship_document,
    fields.document_title_present,
    fields.official_mark_detected,
    fields.appears_full_document,
  ].filter((value) => value === true).length;

  if (fields.appears_full_document === false) {
    invalid.push('appears_full_document');
    suggestions.push('Re-upload the entire citizenship document. Avoid cropped or partial images.');
    complianceFailures.push('Citizenship document appears cropped or partial');
  }

  if (authenticitySignals < 2) {
    invalid.push('document_authenticity');
    warnings.push('Document authenticity checks are weak for this file');
    suggestions.push('Upload a sharper image/scan where title, official marks, and full card are visible.');
    complianceFailures.push('Not enough official citizenship indicators were detected');
  }

  if (extracted.raw_text && !hasCitizenshipKeyword(extracted.raw_text)) {
    warnings.push('OCR text does not clearly indicate a citizenship document');
    if (authenticitySignals < 3) {
      invalid.push('document_authenticity');
      complianceFailures.push('OCR text and structure do not strongly match a citizenship document');
    }
  }

  if (fields.photo_detected === false) {
    warnings.push('Photo not detected on citizenship document');
    suggestions.push('Upload a clearer full document image including photograph area');
  }

  if (fields.signature_detected === false) {
    warnings.push('Signature not detected on citizenship document');
    suggestions.push('Ensure signature area is visible and not cropped');
  }

  const lowConfidenceFields = collectLowConfidenceFields(extracted, [...required, ...recommended]);
  if (lowConfidenceFields.length > 0) {
    warnings.push('Some extracted fields have low confidence');
  }

  const readinessScore = calculateReadinessScore(required, recommended, present);

  return {
    is_valid: missing.length === 0 && invalid.length === 0,
    readiness_score: readinessScore,
    fields_present: [...present],
    fields_missing: unique(missing),
    fields_invalid: unique(invalid),
    low_confidence_fields: lowConfidenceFields,
    compliance_failures: unique(complianceFailures),
    warnings: unique(warnings),
    suggestions: unique(suggestions),
  };
}

function validatePassportPhoto(extracted: PassportPhotoExtraction): ValidationResult {
  const fields = extracted.fields;
  const required = ['face_detected', 'single_face', 'eyes_visible', 'resolution_sufficient'];
  const recommended = [
    'face_centered',
    'background_color',
    'lighting_quality',
    'head_covering_absent',
    'neutral_expression',
    'glare_absent',
    'shadows_absent',
  ];

  const present = new Set<string>();
  const missing: string[] = [];
  const invalid: string[] = [];
  const complianceFailures: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const field of [...required, ...recommended]) {
    const value = fields[field as keyof typeof fields];
    if (isProvided(value)) {
      present.add(field);
    }
  }

  for (const field of required) {
    if (!present.has(field)) {
      missing.push(field);
    }
  }

  if (fields.face_detected === false) {
    invalid.push('face_detected');
    suggestions.push('Upload a passport photo where the face is clearly visible');
    complianceFailures.push('No clearly detectable face for passport photo');
  }

  if (fields.single_face === false) {
    invalid.push('single_face');
    suggestions.push('Passport photo must contain only one person. Upload a solo photo.');
    complianceFailures.push('Passport photo includes multiple faces/people');
  }

  if (fields.eyes_visible === false) {
    invalid.push('eyes_visible');
    suggestions.push('Ensure both eyes are clearly visible and unobstructed.');
    complianceFailures.push('Eyes are not clearly visible in the passport photo');
  }

  if (fields.resolution_sufficient === false) {
    invalid.push('resolution_sufficient');
    suggestions.push('Use a higher-resolution passport photo without blur or compression artifacts.');
    complianceFailures.push('Passport photo resolution/clarity is insufficient');
  }

  if (fields.head_covering_absent === false) {
    invalid.push('head_covering_absent');
    suggestions.push('Remove hats or head coverings unless legally/religiously required.');
    complianceFailures.push('Head covering detected in passport photo');
  }

  if (fields.glare_absent === false) {
    invalid.push('glare_absent');
    suggestions.push('Retake photo to remove glare from skin or glasses.');
    complianceFailures.push('Glare detected in passport photo');
  }

  if (fields.shadows_absent === false) {
    invalid.push('shadows_absent');
    suggestions.push('Use even lighting to avoid facial or background shadows.');
    complianceFailures.push('Shadows detected in passport photo');
  }

  if (fields.background_color && !isPassportBackgroundAcceptable(fields.background_color)) {
    invalid.push('background_color');
    suggestions.push('Use a plain white or very light background for passport compliance.');
    complianceFailures.push('Background is not plain white/light');
  }

  if (fields.face_centered === false) {
    warnings.push('Face appears off-center in the photo');
    suggestions.push('Center the face and keep the head upright in the frame.');
  }

  if (fields.neutral_expression === false) {
    warnings.push('Expression may not be neutral');
    suggestions.push('Use a neutral expression with mouth closed and eyes open.');
  }

  if (fields.lighting_quality && isLightingClearlyPoor(fields.lighting_quality)) {
    invalid.push('lighting_quality');
    suggestions.push('Use evenly lit photo with no harsh contrast or dark areas.');
    complianceFailures.push('Lighting quality appears poor for passport standards');
  }

  const lowConfidenceFields = collectLowConfidenceFields(extracted, [...required, ...recommended]);
  if (lowConfidenceFields.length > 0) {
    warnings.push('Some extracted fields have low confidence');
  }

  const readinessScore = calculateReadinessScore(required, recommended, present);

  return {
    is_valid: missing.length === 0 && invalid.length === 0,
    readiness_score: readinessScore,
    fields_present: [...present],
    fields_missing: unique(missing),
    fields_invalid: unique(invalid),
    low_confidence_fields: lowConfidenceFields,
    compliance_failures: unique(complianceFailures),
    warnings: unique(warnings),
    suggestions: unique(suggestions),
  };
}

export const ocrValidator = {
  validate(documentType: DocumentType, extracted: ExtractedDocument): ValidationResult {
    if (documentType === DocumentType.CITIZENSHIP) {
      return validateCitizenship(extracted as CitizenshipExtraction);
    }

    if (documentType === DocumentType.PASSPORT_PHOTO) {
      return validatePassportPhoto(extracted as PassportPhotoExtraction);
    }

    throw new Error(`Unsupported document type for validator: ${documentType}`);
  },
};

export type { ValidationResult };
