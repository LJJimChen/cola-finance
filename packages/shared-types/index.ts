// Common types for the asset management system

export interface User {
  id: string;
  email: string;
  languagePreference: 'zh' | 'en';
  themeSettings: 'light' | 'dark' | 'auto';
  displayCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValueCny: number;
  dailyProfitCny: number;
  currentTotalProfitCny: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioWithAssets extends Portfolio {
  assets: Asset[];
  categories: Category[];
}

export interface Asset {
  id: string;
  userId: string;
  portfolioId: string;
  categoryId?: string;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  dailyProfit: number;
  currentPrice: number;
  currency: string;
  brokerSource: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  targetAllocation: number; // Percentage: 0.00 to 100.00
  currentAllocation: number; // Calculated percentage
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioHistory {
  id: string;
  portfolioId: string;
  timestamp: Date;
  totalValueCny: number;
  dailyProfitCny: number;
  currentTotalProfitCny: number;
}

export interface ExchangeRate {
  id: string;
  sourceCurrency: string; // Source currency code (e.g., USD)
  targetCurrency: string; // Target currency code (always CNY)
  exchangeRate: number; // Rate from source to target currency
  date: Date; // Date of the exchange rate
  createdAt: Date;
}

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
}

export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface CreateAssetRequest {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  dailyProfit: number;
  currentPrice: number;
  currency: string;
  brokerSource: string;
  categoryId?: string;
}

export interface CreateCategoryRequest {
  name: string;
  targetAllocation?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  targetAllocation?: number;
}

export interface DashboardData {
  totalValue: number;
  dailyProfit: number;
  annualReturn: number;
  currency: string;
  lastUpdated: Date;
  allocationByCategory: Array<{
    categoryName: string;
    percentage: number;
    value: number;
  }>;
  topPerformingAssets: Asset[];
}

export interface AllocationData {
  totalValue: number;
  currency: string;
  categories: Array<{
    id: string;
    name: string;
    targetAllocation: number;
    currentAllocation: number;
    value: number;
    profitAmount: number;
    yield: number;
    assets: Array<{
      id: string;
      symbol: string;
      name: string;
      quantity: number;
      value: number;
      profitAmount: number;
      yield: number;
    }>;
  }>;
}

export interface RebalanceRecommendations {
  portfolioId: string;
  recommendations: Array<{
    categoryId: string;
    categoryName: string;
    currentAllocation: number;
    targetAllocation: number;
    deviation: number;
    recommendation: string;
    suggestedActions: string[];
  }>;
}

export interface HistoricalPerformance {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  snapshots: Array<{
    date: Date;
    totalValue: number;
    dailyProfit: number;
    cumulativeReturn: number;
  }>;
  totalReturn: number;
  volatility: number;
}

export { default as ApiClient, getApiClient } from './api-client';