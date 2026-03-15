export const PASSPORT_STEPS = [
  'Understand requirements',
  'Upload documents',
  'Validate files',
  'Review readiness',
  'Go to official portal',
] as const;

export const NEXT_STEP_TIMELINE = [
  {
    title: 'Complete missing details',
    detail: 'Fill all required passport application fields from your extracted documents.',
  },
  {
    title: 'Confirm extracted information',
    detail: 'Review OCR values and correct any mismatch before submission.',
  },
  {
    title: 'Upload final required files',
    detail: 'Make sure citizenship and passport photo files are uploaded and readable.',
  },
  {
    title: 'Proceed to official passport portal',
    detail: 'Submit your application through Nepal official passport service.',
  },
];

export const ASSISTANT_PROMPTS = [
  'What documents do I need for a passport?',
  'Can I apply with these documents?',
  'What should I do next?',
  'Is my citizenship document enough?',
  'Will this photo be accepted?',
];

export const COMMON_ERRORS = [
  'Citizenship image is blurry or cropped',
  'Photo background is not plain or face is not centered',
  'Name mismatch between extracted fields',
  'Missing district or issue details in extraction',
];
