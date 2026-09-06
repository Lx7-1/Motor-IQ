import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ar from './locales/ar.json';
import ckb from './locales/ckb.json';
import kmr from './locales/kmr.json';

const SUPPORTED_LANGUAGES = ['en', 'ar', 'ckb', 'kmr'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      ckb: { translation: ckb },
      kmr: { translation: kmr },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'iq-motor-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export function getDirection(lng: string): 'ltr' | 'rtl' {
  return lng === 'ar' || lng === 'ckb' || lng === 'kmr' ? 'rtl' : 'ltr';
}

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' as const },
  { code: 'ar', label: 'العربية', dir: 'rtl' as const },
  { code: 'ckb', label: 'سۆرانی', dir: 'rtl' as const },
  { code: 'kmr', label: 'بادینی', dir: 'rtl' as const },
];

export { SUPPORTED_LANGUAGES };
export default i18n;
