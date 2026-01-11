/**
 * i18n configuration
 * 
 * Intent: Setup internationalization for English and Chinese locales
 * Auto-detects browser/OS locale, allows user override
 * 
 * Contract:
 * - Supported locales: en, zh
 * - Auto-detect from navigator.language
 * - Persists user preference to localStorage
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

/**
 * English translations
 */
const en = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  auth: {
    signin: 'Sign In',
    signup: 'Sign Up',
    signout: 'Sign Out',
    email: 'Email',
    password: 'Password',
    forgot_password: 'Forgot Password?',
  },
  // More translations will be added in Phase 3
}

/**
 * Chinese translations
 */
const zh = {
  common: {
    loading: '加载中...',
    error: '错误',
    retry: '重试',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
  },
  auth: {
    signin: '登录',
    signup: '注册',
    signout: '登出',
    email: '邮箱',
    password: '密码',
    forgot_password: '忘记密码？',
  },
  // More translations will be added in Phase 3
}

/**
 * Detect user's preferred locale
 * 
 * Intent: Auto-detect from browser, fallback to English
 */
function detectLocale(): 'en' | 'zh' {
  // Check localStorage for saved preference
  const saved = localStorage.getItem('locale')
  if (saved === 'en' || saved === 'zh') {
    return saved
  }

  // Auto-detect from browser
  const browserLang = navigator.language.toLowerCase()

  if (browserLang.startsWith('zh')) {
    return 'zh'
  }

  return 'en'
}

/**
 * Initialize i18next
 */
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
})

/**
 * Change locale and persist to localStorage
 * 
 * Intent: Allow user to manually switch language
 */
export function changeLocale(locale: 'en' | 'zh') {
  i18n.changeLanguage(locale)
  localStorage.setItem('locale', locale)
}

export default i18n
