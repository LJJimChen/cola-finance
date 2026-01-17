import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            Cola Finance
          </Link>
          <div className="flex space-x-4">
            <Link to="/dashboard" className="hover:underline">
              {t('common.dashboard')}
            </Link>
            <Link to="/portfolio" className="hover:underline">
              {t('common.portfolio')}
            </Link>
            <Link to="/rebalance" className="hover:underline">
              {t('common.rebalance')}
            </Link>
            <Link to="/settings" className="hover:underline">
              {t('common.settings')}
            </Link>
            <button className="hover:underline">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-6">
        {children}
      </main>
      <footer className="bg-muted py-4 mt-8">
        <div className="container mx-auto text-center">
          © {new Date().getFullYear()} Cola Finance. {t('common.allRightsReserved')}.
        </div>
      </footer>
    </div>
  );
};

export default Layout;