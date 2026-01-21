import { integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  languagePreference: text('language_preference').default('zh'),
  themeSettings: text('theme_settings').default('auto'),
  displayCurrency: text('display_currency').default('CNY'),
  timeZone: text('time_zone').default('Asia/Shanghai'),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Portfolios table
export const portfolios = sqliteTable('portfolios', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  targetAllocationBps: integer('target_allocation_bps').notNull(),
  currentAllocationBps: integer('current_allocation_bps').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  uniqueIndex('categories_portfolio_id_name_unique').on(t.portfolioId, t.name),
]);

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  costBasis4: integer('cost_basis4').notNull(),
  dailyProfit4: integer('daily_profit4').notNull(),
  currentPrice4: integer('current_price4').notNull(),
  currency: text('currency').notNull(),
  brokerSource: text('broker_source').notNull(),
  brokerAccount: text('broker_account').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const portfolioHistories = sqliteTable('portfolio_histories', {
  id: text('id').primaryKey(),
  portfolioId: text('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
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
