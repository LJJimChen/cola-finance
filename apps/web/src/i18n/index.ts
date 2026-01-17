import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// Create locales directory and files
// This will be done separately

export const resources = {
  en: {
    translation: enTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    // Disable key validation in development for easier testing
    // Remove this in production if you want strict key checking
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;