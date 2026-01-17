import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
  languagePreference: z.enum(['zh', 'en']),
  themeSetting: z.enum(['light', 'dark']),
  displayCurrency: z.string(),
  timezone: z.string(),
});

export const UserUpdateRequestSchema = z.object({
  languagePreference: z.enum(['zh', 'en']).optional(),
  themeSetting: z.enum(['light', 'dark']).optional(),
  displayCurrency: z.string().optional(),
  timezone: z.string().optional(),
});

// Asset schemas
export const AssetSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  symbol: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  purchasePrice: z.number().nonnegative(),
  currentPrice: z.number().nonnegative(),
  currency: z.string().length(3),
  brokerSource: z.string(),
  categoryId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AssetCreateRequestSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  quantity: z.number().nonnegative(),
  purchasePrice: z.number().nonnegative(),
  currentPrice: z.number().nonnegative(),
  currency: z.string().length(3),
  brokerSource: z.string(),
  categoryId: z.string().uuid().optional(),
});

export const AssetUpdateRequestSchema = z.object({
  quantity: z.number().nonnegative().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  currentPrice: z.number().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
});

// Category schemas
export const CategorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  isCustom: z.boolean(),
  targetAllocation: z.number().min(0).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CategoryCreateRequestSchema = z.object({
  name: z.string(),
  targetAllocation: z.number().min(0).max(100),
});

export const CategoryUpdateRequestSchema = z.object({
  name: z.string().optional(),
  targetAllocation: z.number().min(0).max(100).optional(),
});

// Exchange Rate schemas
export const ExchangeRateSchema = z.object({
  id: z.string().uuid(),
  fromCurrency: z.string().length(3),
  toCurrency: z.string().length(3),
  rateValue: z.number().positive(),
  date: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Portfolio History schemas
export const PortfolioHistorySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.date(),
  totalValue: z.number().nonnegative(),
  dailyReturnRate: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Request query schemas
export const GetAssetsQuerySchema = z.object({
  category: z.string().uuid().optional(),
  broker: z.string().optional(),
});

export const GetDashboardQuerySchema = z.object({
  currency: z.string().optional(),
});

export const GetPortfolioQuerySchema = z.object({
  currency: z.string().optional(),
});

export const GetRebalanceQuerySchema = z.object({
  currency: z.string().optional(),
});

export const GetExchangeRatesQuerySchema = z.object({
  from: z.string().length(3).optional(),
  to: z.string().length(3).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GetPortfolioHistoryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().optional(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type AssetCreateRequest = z.infer<typeof AssetCreateRequestSchema>;
export type AssetUpdateRequest = z.infer<typeof AssetUpdateRequestSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type CategoryCreateRequest = z.infer<typeof CategoryCreateRequestSchema>;
export type CategoryUpdateRequest = z.infer<typeof CategoryUpdateRequestSchema>;
export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;
export type PortfolioHistory = z.infer<typeof PortfolioHistorySchema>;