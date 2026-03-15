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
  warnings: string[];
  suggestions: string[];
}

function isNonEmpty(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
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
  ];

  const present = new Set<string>();
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const field of [...required, ...recommended]) {
    const value = fields[field as keyof typeof fields];
    if (isNonEmpty(value)) {
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
    fields_missing: missing,
    fields_invalid: invalid,
    low_confidence_fields: lowConfidenceFields,
    warnings,
    suggestions,
  };
}

function validatePassportPhoto(extracted: PassportPhotoExtraction): ValidationResult {
  const fields = extracted.fields;
  const required = ['face_detected'];
  const recommended = ['face_centered', 'background_color', 'resolution_sufficient', 'lighting_quality'];

  const present = new Set<string>();
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (typeof fields.face_detected === 'boolean') {
    present.add('face_detected');
  }

  if (typeof fields.face_centered === 'boolean') {
    present.add('face_centered');
  }

  if (fields.background_color) {
    present.add('background_color');
  }

  if (typeof fields.resolution_sufficient === 'boolean') {
    present.add('resolution_sufficient');
  }

  if (fields.lighting_quality) {
    present.add('lighting_quality');
  }

  if (!present.has('face_detected')) {
    missing.push('face_detected');
  }

  if (fields.face_detected === false) {
    invalid.push('face_detected');
    suggestions.push('Upload a passport photo where the face is clearly visible');
  }

  if (fields.background_color && fields.background_color.toLowerCase() !== 'white') {
    warnings.push('Passport photo background is not white');
  }

  if (fields.face_centered === false) {
    warnings.push('Face appears off-center in the photo');
  }

  if (fields.resolution_sufficient === false) {
    warnings.push('Photo resolution appears insufficient');
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
    fields_missing: missing,
    fields_invalid: invalid,
    low_confidence_fields: lowConfidenceFields,
    warnings,
    suggestions,
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
