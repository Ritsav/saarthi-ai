import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

void i18n.use(Backend).use(initReactI18next).init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'ne'],
  defaultNS: 'translation',
  lng: localStorage.getItem('saarthi_language') || 'en',
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
