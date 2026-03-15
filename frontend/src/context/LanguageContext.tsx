import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import i18n from '@/config/i18n';
import api from '@/config/api';

interface LanguageContextValue {
  language: 'en' | 'ne';
  setLanguage: (language: 'en' | 'ne') => Promise<void>;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<'en' | 'ne'>((localStorage.getItem('saarthi_language') as 'en' | 'ne') || 'en');

  const setLanguage = useCallback(async (nextLanguage: 'en' | 'ne') => {
    setLanguageState(nextLanguage);
    localStorage.setItem('saarthi_language', nextLanguage);
    await i18n.changeLanguage(nextLanguage);

    try {
      await api.patch('/api/auth/me', { language_preference: nextLanguage });
    } catch {
      // Intentionally non-blocking.
    }
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
