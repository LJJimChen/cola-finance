// Define shared TypeScript types here
// This file will be updated as we implement more features

export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  languagePreference: 'zh' | 'en';
  themeSetting: 'light' | 'dark';
  displayCurrency: string;
  timezone: string;
}

export interface Asset {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currency: string;
  brokerSource: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  isCustom: boolean;
  targetAllocation: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rateValue: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioHistory {
  id: string;
  userId: string;
  date: Date;
  totalValue: number;
  dailyReturnRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}