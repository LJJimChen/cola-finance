import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, language, changeLanguage, supportedLanguages } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">
              Cola Finance
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Navigation Links */}
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
              </div>

              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <label htmlFor="language-switcher" className="text-sm">
                  {t('settings.language')}:
                </label>
                <select
                  id="language-switcher"
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value as 'en' | 'zh')}
                  className="bg-primary text-primary-foreground border border-primary-foreground rounded p-1"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button className="hover:underline">
                {t('common.logout')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-primary-foreground focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <Link to="/dashboard" className="hover:underline py-1" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.dashboard')}
                </Link>
                <Link to="/portfolio" className="hover:underline py-1" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.portfolio')}
                </Link>
                <Link to="/rebalance" className="hover:underline py-1" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.rebalance')}
                </Link>
                <Link to="/settings" className="hover:underline py-1" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.settings')}
                </Link>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-primary-foreground/30">
                <label htmlFor="language-switcher-mobile" className="text-sm">
                  {t('settings.language')}:
                </label>
                <select
                  id="language-switcher-mobile"
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value as 'en' | 'zh')}
                  className="bg-primary text-primary-foreground border border-primary-foreground rounded p-1 flex-grow"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <button className="hover:underline w-full text-left py-1">
                {t('common.logout')}
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="bg-muted py-4 mt-8">
        <div className="container mx-auto text-center px-4">
          © {new Date().getFullYear()} Cola Finance. {t('common.allRightsReserved')}.
        </div>
      </footer>
    </div>
  );
};

export default Layout;