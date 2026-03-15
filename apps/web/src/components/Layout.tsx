import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { useI18n } from '../lib/i18n';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useI18n();
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavClass = (path: string) => {
    const isActive = currentPath === path;
    return `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-primary'} transition-colors cursor-pointer group`;
  };

  return (
    <div className="relative flex h-full h-screen w-full flex-col overflow-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white">
      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 pb-24 mt-[calc(env(safe-area-inset-top)+1rem)] overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-surface-light/90 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/5 pb-6 pt-3 px-6 flex justify-between items-center z-50">
        <Link to="/dashboard" className={getNavClass('/dashboard')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/dashboard' ? 'filled' : ''}`}>dashboard</span>
          <span className="text-[10px] font-medium">{t('common.dashboard')}</span>
        </Link>
        <Link to="/portfolio" className={getNavClass('/portfolio')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/portfolio' ? 'filled' : ''}`}>pie_chart</span>
          <span className="text-[10px] font-medium">{t('common.portfolio')}</span>
        </Link>
        <Link to="/analysis" className={getNavClass('/analysis')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/analysis' ? 'filled' : ''}`}>show_chart</span>
          <span className="text-[10px] font-medium">{t('common.analysis')}</span>
        </Link>
        <Link to="/rebalance" className={getNavClass('/rebalance')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/rebalance' ? 'filled' : ''}`}>scale</span>
          <span className="text-[10px] font-medium">{t('common.rebalance')}</span>
        </Link>
        <Link to="/notifications" className={getNavClass('/notifications')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/notifications' ? 'filled' : ''}`}>notifications</span>
          <span className="text-[10px] font-medium">{t('common.notifications')}</span>
        </Link>
        <Link to="/settings" className={getNavClass('/settings')}>
          <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${currentPath === '/settings' ? 'filled' : ''}`}>settings</span>
          <span className="text-[10px] font-medium">{t('common.settings')}</span>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;