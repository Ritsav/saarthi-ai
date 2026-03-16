export type ProcessType = 'PASSPORT_APPLICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  contact_number?: string | null;
  home_phone?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  language_preference?: 'en' | 'ne';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
