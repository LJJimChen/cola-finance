import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { getApiClient } from '@repo/shared-types';
import { Link, useNavigate } from '@tanstack/react-router';

const SignUpPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const client = getApiClient();
      // Signup returns { success: boolean; userId: string }
      // After signup, we should probably auto-login or redirect to login
      const { success } = await client.signup(email, password);
      
      if (success) {
        // Auto-login after signup for better UX
        const loginResult = await client.login(email, password);
        if (loginResult.success) {
            window.location.href = '/dashboard';
        } else {
            // Fallback to login page if auto-login fails
            navigate({ to: '/login' });
        }
      } else {
        setError('Signup failed');
      }
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-display text-slate-900 selection:bg-blue-100 selection:text-blue-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>lock_person</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('auth.createAccount')}</h1>
          <p className="text-slate-500 text-sm">{t('auth.signupSubtitle')}</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-6">
           {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="group">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-0 focus:outline-none transition-colors text-base" 
              placeholder={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="group relative">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-0 focus:outline-none transition-colors text-base pr-10" 
              placeholder={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              className="absolute inset-y-0 right-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors" 
              type="button"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility_off</span>
            </button>
          </div>
          <div className="group">
            <input 
              className="block w-full px-0 py-3 bg-transparent border-0 border-b border-slate-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-0 focus:outline-none transition-colors text-base" 
              placeholder={t('auth.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button 
            className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-medium text-sm py-4 rounded-lg transition-all duration-200 shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('common.signup')}
          </button>
        </form>

        <div className="text-center mt-2">
          <Link to="/login" className="text-sm text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
            {t('auth.alreadyHaveAccount')} <span className="text-primary font-medium hover:text-primary-dark hover:underline underline-offset-4 decoration-primary/30 transition-all">{t('common.login')}</span>
          </Link>
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '14px' }}>encrypted</span>
            <span>{t('auth.localEncryption')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
