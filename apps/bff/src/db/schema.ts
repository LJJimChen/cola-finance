import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  languagePreference: text('language_preference').notNull(),
  themeSettings: text('theme_settings').notNull(),
  displayCurrency: text('display_currency').notNull(),
  timeZone: text('time_zone').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const portfolios = sqliteTable('portfolios', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  totalValueCny4: integer('total_value_cny4').notNull(),
  dailyProfitCny4: integer('daily_profit_cny4').notNull(),
  currentTotalProfitCny4: integer('current_total_profit_cny4').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  portfolioId: text('portfolio_id').notNull(),
  name: text('name').notNull(),
  targetAllocationBps: integer('target_allocation_bps').notNull(),
  currentAllocationBps: integer('current_allocation_bps').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  portfolioId: text('portfolio_id').notNull(),
  categoryId: text('category_id'),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  costBasis4: integer('cost_basis4').notNull(),
  dailyProfit4: integer('daily_profit4').notNull(),
  currentPrice4: integer('current_price4').notNull(),
  currency: text('currency').notNull(),
  brokerSource: text('broker_source').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const portfolioHistories = sqliteTable('portfolio_histories', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull(),
  timestampUtc: text('timestamp_utc').notNull(),
  totalValueCny4: integer('total_value_cny4').notNull(),
  dailyProfitCny4: integer('daily_profit_cny4').notNull(),
  currentTotalProfitCny4: integer('current_total_profit_cny4').notNull(),
});

export const exchangeRates = sqliteTable('exchange_rates', {
  id: text('id').primaryKey(),
  sourceCurrency: text('source_currency').notNull(),
  targetCurrency: text('target_currency').notNull(),
  rate8: integer('rate8').notNull(),
  date: text('date').notNull(),
  createdAt: text('created_at').notNull(),
});
