import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { getApiClient } from '@repo/shared-types';
import { Link, useNavigate } from '@tanstack/react-router';

const LoginPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const client = getApiClient();
      const { success } = await client.login(email, password);
      if (success) {
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-white overflow-x-hidden selection:bg-primary selection:text-white flex flex-col items-center justify-center">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] px-6 w-full max-w-sm mx-auto">
        <div className="w-full text-center mb-10 animate-[fadeIn_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-5 ring-1 ring-primary/20">
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lock</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2">{t('auth.welcomeBack')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('auth.loginSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 animate-[fadeIn_0.8s_ease-out]">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="sr-only">{t('auth.email')}</label>
              <input 
                autoComplete="username" 
                className="block w-full px-4 py-3.5 bg-white dark:bg-[#0c1a11] border border-slate-200 dark:border-[#2a4a35] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-sm" 
                placeholder={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <label className="sr-only">{t('auth.password')}</label>
              <input 
                autoComplete="current-password" 
                className="block w-full px-4 py-3.5 bg-white dark:bg-[#0c1a11] border border-slate-200 dark:border-[#2a4a35] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-sm" 
                placeholder={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer" 
                type="button"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <a className="text-xs font-medium text-slate-500 hover:text-primary transition-colors" href="#">{t('auth.forgotPassword')}</a>
          </div>

          <button 
            className="w-full mt-4 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-sm py-3.5 rounded-xl shadow-none hover:shadow-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed" 
            type="submit"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.login')}
          </button>
        </form>

        <div className="w-full mt-8 animate-[fadeIn_1.0s_ease-out]">
          <div className="absolute bottom-6 w-full flex flex-col items-center gap-4">
            <p className="text-[13px] text-slate-500">
              {t('auth.dontHaveAccount')} 
              <Link to="/signup" className="text-primary hover:text-primary-dark font-medium hover:underline transition-colors ml-1">
                {t('common.signup')}
              </Link>
            </p>
            <div className="flex items-center gap-1.5 opacity-40 hover:opacity-80 transition-opacity select-none" title="All data is encrypted locally">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>encrypted</span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">{t('auth.localEncryption')}</span>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
