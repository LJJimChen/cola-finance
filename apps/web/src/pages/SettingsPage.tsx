import React from 'react';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import { useNavigate } from '@tanstack/react-router';
import { getApiClient } from '@repo/shared-types';

const SettingsPage: React.FC = () => {
  const { t, language, changeLanguage, supportedLanguages } = useI18n();
  const navigate = useNavigate();
  
  // Mock theme state for now (would use a theme provider in real app)
  const [theme, setTheme] = React.useState<'light' | 'dark' | 'auto'>('dark');

  const toggleTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto logic
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await getApiClient().logout();
    } finally {
      navigate({ to: '/login' });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between py-4 pb-2 border-b border-gray-200 dark:border-white/5 mb-4">
          <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">{t('settings.title')}</h2>
          <div className="size-10"></div>
        </header>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">{t('settings.account')}</h3>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
              {t('common.logout')}
            </button>
          </div>

          {/* Language Settings */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">{t('settings.language')}</h3>
            <div className="flex gap-2">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    language === lang
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {lang === 'en' ? 'English' : '中文'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-4">
            <h3 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">{t('settings.theme')}</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'auto'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => toggleTheme(option)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    theme === option
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {t(`settings.themeOptions.${option}`)}
                </button>
              ))}
            </div>
          </div>

          {/* App Info */}
          <div className="text-center text-xs text-gray-400 mt-8">
            <p>Cola Finance v1.0.0</p>
            <p className="mt-1">{t('common.allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
