import { pgTable, serial, text, integer, decimal, timestamp, uuid, boolean, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  languagePreference: text('language_preference', { enum: ['zh', 'en'] }).default('en').notNull(),
  themeSetting: text('theme_setting', { enum: ['light', 'dark'] }).default('light').notNull(),
  displayCurrency: text('display_currency').default('USD').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
});

// Assets table
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  quantity: decimal('quantity').notNull(),
  purchasePrice: decimal('purchase_price').notNull(),
  currentPrice: decimal('current_price').notNull(),
  currency: text('currency').notNull(), // ISO 4217 currency code
  brokerSource: text('broker_source').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  isCustom: boolean('is_custom').default(true).notNull(),
  targetAllocation: decimal('target_allocation').notNull(), // Percentage (0-100)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Exchange Rates table
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromCurrency: text('from_currency').notNull(), // ISO 4217 currency code
  toCurrency: text('to_currency').notNull(),     // ISO 4217 currency code
  rateValue: decimal('rate_value').notNull(),
  date: date('date').default(sql`CURRENT_DATE`).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Portfolio History table
export const portfolioHistories = pgTable('portfolio_histories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').default(sql`CURRENT_DATE`).notNull(),
  totalValue: decimal('total_value').notNull(),
  dailyReturnRate: decimal('daily_return_rate'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Indexes
export const idxAssetUserId = assets.userId.index('idx_asset_user_id');
export const idxAssetCategoryId = assets.categoryId.index('idx_asset_category_id');
export const idxAssetBrokerSource = assets.brokerSource.index('idx_asset_broker_source');
export const idxCategoryUserId = categories.userId.index('idx_category_user_id');
export const idxExchangeRateCurrenciesDate = exchangeRates.fromCurrency
  .index('idx_exchange_rate_currencies_date')
  .$col(exchangeRates.toCurrency, exchangeRates.date);
export const idxPortfolioHistoryUserIdDate = portfolioHistories.userId
  .index('idx_portfolio_history_user_date')
  .$col(portfolioHistories.date.desc());