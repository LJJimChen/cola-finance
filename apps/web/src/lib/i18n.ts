import { atom, useAtom } from 'jotai';

// Define available languages
export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Define translation resources type
export interface TranslationResources {
  [key: string]: string | TranslationResources;
}

// English translations
const enTranslations: TranslationResources = {
  common: {
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    portfolio: 'Portfolio',
    rebalance: 'Rebalance',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    signup: 'Sign Up',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  dashboard: {
    title: 'Dashboard',
    totalValue: 'Total Value',
    dailyProfit: 'Daily Profit',
    annualReturn: 'Annual Return',
    allocationChart: 'Allocation Chart',
    topPerformers: 'Top Performers',
  },
  portfolio: {
    title: 'Portfolio',
    assets: 'Assets',
    categories: 'Categories',
    allocation: 'Allocation',
    profit: 'Profit',
    yield: 'Yield',
    addAsset: 'Add Asset',
    addCategory: 'Add Category',
  },
  rebalance: {
    title: 'Rebalance',
    targetAllocation: 'Target Allocation',
    currentAllocation: 'Current Allocation',
    deviation: 'Deviation',
    recommendations: 'Recommendations',
    suggestedActions: 'Suggested Actions',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    currency: 'Display Currency',
    themeOptions: {
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
    },
  },
};

// Chinese translations
const zhTranslations: TranslationResources = {
  common: {
    welcome: '欢迎',
    dashboard: '仪表板',
    portfolio: '投资组合',
    rebalance: '再平衡',
    settings: '设置',
    login: '登录',
    logout: '登出',
    signup: '注册',
    save: '保存',
    cancel: '取消',
    loading: '加载中...',
    error: '错误',
    success: '成功',
  },
  dashboard: {
    title: '仪表板',
    totalValue: '总价值',
    dailyProfit: '日收益',
    annualReturn: '年回报率',
    allocationChart: '分配图表',
    topPerformers: '表现最佳',
  },
  portfolio: {
    title: '投资组合',
    assets: '资产',
    categories: '分类',
    allocation: '分配',
    profit: '利润',
    yield: '收益率',
    addAsset: '添加资产',
    addCategory: '添加分类',
  },
  rebalance: {
    title: '再平衡',
    targetAllocation: '目标分配',
    currentAllocation: '当前分配',
    deviation: '偏差',
    recommendations: '建议',
    suggestedActions: '建议操作',
  },
  settings: {
    title: '设置',
    language: '语言',
    theme: '主题',
    currency: '显示货币',
    themeOptions: {
      light: '明亮',
      dark: '暗黑',
      auto: '自动',
    },
  },
};

// Create the translations map
const translationsMap: Record<Language, TranslationResources> = {
  en: enTranslations,
  zh: zhTranslations,
};

// Atom to store the current language
export const languageAtom = atom<Language>('en');

// Hook to use the i18n functionality
export const useI18n = () => {
  const [language, setLanguage] = useAtom(languageAtom);

  // Function to get a translation by key
  const t = (key: string): string => {
    const keys = key.split('.');
    let translation: any = translationsMap[language];

    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        return key; // Return the key if translation is not found
      }
    }

    return typeof translation === 'string' ? translation : key;
  };

  // Function to change the language
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