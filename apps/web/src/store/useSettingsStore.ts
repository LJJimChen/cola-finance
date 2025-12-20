import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: 'en' | 'zh';
  currency: 'CNY' | 'USD';
  theme: 'light' | 'dark';
  setLanguage: (lang: 'en' | 'zh') => void;
  setCurrency: (currency: 'CNY' | 'USD') => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      currency: 'CNY',
      theme: 'light',
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'cola-settings',
    }
  )
);
