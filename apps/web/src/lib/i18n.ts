import { create } from 'zustand';
import { en } from '../i18n/en';
import { zh } from '../i18n/zh';

// Define available languages
export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Define translation resources type
export interface TranslationResources {
  [key: string]: string | TranslationResources;
}

// Create the translations map
const translationsMap: Record<Language, TranslationResources> = {
  en,
  zh,
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));

// Memoized translation function helper
const getTranslation = (currentLanguage: Language, key: string): string => {
  const keys = key.split('.');
  let translation: any = translationsMap[currentLanguage];

  for (const k of keys) {
    if (translation && typeof translation === 'object') {
      translation = translation[k];
    } else {
      return key; // Return the key if translation is not found
    }
  }

  return typeof translation === 'string' ? translation : key;
};

// Hook to use the i18n functionality
export const useI18n = () => {
  const { language, setLanguage } = useLanguageStore();

  const t = (key: string) => getTranslation(language, key);

  const changeLanguage = (lang: Language) => {
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      setLanguage(lang);
    }
  };

  return {
    t,
    language,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
};

// Export the default language
export const DEFAULT_LANGUAGE: Language = 'en';
