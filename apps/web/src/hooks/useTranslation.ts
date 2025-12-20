import { useSettingsStore } from '../store/useSettingsStore';
import { en } from '../i18n/en';
import { zh } from '../i18n/zh';

const locales = { en, zh };

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  const t = locales[language] || locales.en;
  
  return { t, language };
}
