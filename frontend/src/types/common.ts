export type ProcessType = 'PASSPORT_APPLICATION';

export interface User {
  id: string;
  name: string;
  email: string;
  language_preference?: 'en' | 'ne';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
