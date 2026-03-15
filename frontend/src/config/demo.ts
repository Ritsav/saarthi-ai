import type { DocumentItem, ProcessInfo, ProcessType, Requirement, User } from '@/types';

export const DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? 'true') !== 'false';

export const DEMO_CREDENTIALS = {
  name: 'Nabin Budha',
  email: 'nabin@gmail.com',
  password: 'Demo@1234',
};

const DEMO_USER_KEY = 'saarthi_demo_user';
const DEMO_PASSWORD_KEY = 'saarthi_demo_password';
const DEMO_DOCUMENTS_KEY = 'saarthi_demo_documents';
const DEMO_TOKEN = 'demo-static-token';

function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDemoToken() {
  return DEMO_TOKEN;
}

export function getDemoUser(): User | null {
  return safeRead<User | null>(DEMO_USER_KEY, null);
}

export function setDemoUser(user: User, password?: string) {
  safeWrite<User>(DEMO_USER_KEY, user);
  if (password) {
    localStorage.setItem(DEMO_PASSWORD_KEY, password);
  }
}

export function clearDemoUser() {
  localStorage.removeItem(DEMO_USER_KEY);
}

export function getEffectiveDemoCredentials() {
  const user = getDemoUser();
  const password = localStorage.getItem(DEMO_PASSWORD_KEY) || DEMO_CREDENTIALS.password;

  return {
    name: user?.name || DEMO_CREDENTIALS.name,
    email: user?.email || DEMO_CREDENTIALS.email,
    password,
  };
}

const PASSPORT_PROCESS: ProcessInfo = {
  type: 'PASSPORT_APPLICATION',
  name: 'Nepal Passport Application',
  description: 'Prepare and validate your documents before official passport submission.',
  portal_url: 'https://nepalpassport.gov.np',
  authority: 'Department of Passports, Nepal',
  estimated_time: '7-15 business days (regular)',
  government_fee: 'Rs. 5,000 (regular)',
};

const PASSPORT_REQUIREMENTS: Array<{ requirement: string; document_type: string }> = [
  { requirement: 'Citizenship / National ID copy', document_type: 'CITIZENSHIP' },
  { requirement: 'Recent passport-size photo', document_type: 'PASSPORT_PHOTO' },
  { requirement: 'Supporting address/contact document', document_type: 'SUPPORTING_DOC' },
];

export function getDemoProcessInfo(_type: ProcessType): ProcessInfo {
  return PASSPORT_PROCESS;
}

export function getDemoChecklist(_type: ProcessType, documents: DocumentItem[]): { checklist: Requirement[]; overallReadiness: number } {
  const docsForProcess = documents.filter((doc) => doc.process_type === 'PASSPORT_APPLICATION');
  const completedCount = Math.min(docsForProcess.length, PASSPORT_REQUIREMENTS.length);

  const checklist: Requirement[] = PASSPORT_REQUIREMENTS.map((item, index) => {
    const completed = index < completedCount;
    const doc = completed ? docsForProcess[index] : undefined;

    return {
      requirement: item.requirement,
      document_type: item.document_type,
      status: completed ? 'completed' : 'missing',
      document_id: doc?.id || null,
      readiness_score: completed ? 85 : 0,
      notes: completed ? 'Verified in demo mode' : 'Not uploaded yet',
    };
  });

  const overallReadiness = Math.round((completedCount / PASSPORT_REQUIREMENTS.length) * 100);
  return { checklist, overallReadiness };
}

const SEED_DOCUMENTS: DocumentItem[] = [
  {
    id: 'demo-doc-1',
    file_name: 'citizenship-sample.pdf',
    file_type: 'application/pdf',
    file_size: 234000,
    process_type: 'PASSPORT_APPLICATION',
    document_type: 'CITIZENSHIP',
    status: 'analyzed',
    created_at: new Date().toISOString(),
    validation_result: {
      fields: [
        { name: 'Full Name', value: 'Nabin Budha', status: 'present' },
        { name: 'Document Number', value: '12-34-56-78901', status: 'present' },
      ],
      warnings: [],
      suggestions: ['Looks good for submission.'],
      readiness_score: 90,
    },
  },
];

export function getDemoDocuments(): DocumentItem[] {
  const documents = safeRead<DocumentItem[]>(DEMO_DOCUMENTS_KEY, []);
  if (documents.length) return documents;
  safeWrite(DEMO_DOCUMENTS_KEY, SEED_DOCUMENTS);
  return SEED_DOCUMENTS;
}

export function setDemoDocuments(documents: DocumentItem[]) {
  safeWrite(DEMO_DOCUMENTS_KEY, documents);
  window.dispatchEvent(new Event('saarthi-demo-documents-changed'));
}
