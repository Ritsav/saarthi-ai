export const PASSPORT_STEPS = [
  'Understand requirements',
  'Upload documents',
  'Validate files',
  'Review readiness',
  'Go to official portal',
] as const;

export const REQUIRED_DOCUMENTS = [
  { key: 'citizenship', label: 'Citizenship / National ID copy', required: true },
  { key: 'photo', label: 'Recent passport-size photo', required: true },
  { key: 'supporting', label: 'Supporting address/contact documents', required: false },
] as const;

export const COMMON_ERRORS = [
  'Blurry citizenship image or cropped corners',
  'Photo background not plain or face not centered',
  'Name mismatch between documents',
  'Missing district or issue details in OCR extraction',
];

export const NEXT_STEP_TIMELINE = [
  {
    title: 'Fix flagged issues',
    detail: 'Replace low-quality photo and fill any missing personal details.',
  },
  {
    title: 'Confirm extracted information',
    detail: 'Review OCR fields and approve only correct values.',
  },
  {
    title: 'Preview final application fields',
    detail: 'Verify personal, address, and citizenship sections.',
  },
  {
    title: 'Proceed to official passport portal',
    detail: 'Submit your final application through Nepal official passport service.',
  },
];

export const PORTAL_LINK = 'https://nepalpassport.gov.np';

export const ASSISTANT_PROMPTS = [
  'What documents do I need for a passport?',
  'Can I apply with these documents?',
  'What should I do next?',
  'Is my citizenship document enough?',
  'Will this photo be accepted?',
];

export type FieldStatus = 'confirmed' | 'needs_review' | 'missing' | 'low_confidence';

export interface OCRField {
  key: string;
  label: string;
  value: string;
  status: FieldStatus;
  confidence: number;
}

export const DEFAULT_OCR_FIELDS: OCRField[] = [
  { key: 'full_name', label: 'Full name', value: 'Nabin Budha', status: 'confirmed', confidence: 0.98 },
  { key: 'date_of_birth', label: 'Date of birth', value: '1998-10-09', status: 'confirmed', confidence: 0.93 },
  { key: 'citizenship_number', label: 'Citizenship number', value: '12-34-56-78901', status: 'confirmed', confidence: 0.94 },
  { key: 'district', label: 'District', value: 'Dolpa', status: 'needs_review', confidence: 0.75 },
  { key: 'gender', label: 'Gender', value: 'Male', status: 'confirmed', confidence: 0.95 },
  { key: 'issue_date', label: 'Issue date', value: '', status: 'missing', confidence: 0.1 },
];

export const APPLICATION_SECTIONS = [
  {
    title: 'Personal information',
    fields: ['full_name', 'date_of_birth', 'gender'],
  },
  {
    title: 'Address details',
    fields: ['district', 'address_line'],
  },
  {
    title: 'Citizenship information',
    fields: ['citizenship_number', 'issue_date'],
  },
  {
    title: 'Contact details',
    fields: ['phone', 'email'],
  },
  {
    title: 'Passport-specific information',
    fields: ['passport_type', 'appointment_city'],
  },
] as const;

export const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full name',
  date_of_birth: 'Date of birth',
  gender: 'Gender',
  district: 'District',
  address_line: 'Address line',
  citizenship_number: 'Citizenship number',
  issue_date: 'Issue date',
  phone: 'Phone number',
  email: 'Email',
  passport_type: 'Passport type',
  appointment_city: 'Appointment city',
};

export const INITIAL_FORM_VALUES: Record<string, string> = {
  full_name: 'Nabin Budha',
  date_of_birth: '1998-10-09',
  gender: 'Male',
  district: 'Dolpa',
  address_line: '',
  citizenship_number: '12-34-56-78901',
  issue_date: '',
  phone: '',
  email: 'nabin@gmail.com',
  passport_type: 'Ordinary',
  appointment_city: 'Kathmandu',
};
