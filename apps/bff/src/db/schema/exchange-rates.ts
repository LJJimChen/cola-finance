/**
 * Exchange Rates table schema (Drizzle ORM)
 * 
 * Intent: Store historical exchange rates for USD/CNY and HKD/CNY pairs only
 * Other currency pairs use latest cached rates from Cloudflare KV
 * 
 * Contract:
 * - One daily record per (base_currency, target_currency, rate_date)
 * - Only USD/CNY and HKD/CNY pairs persisted
 * - Historical snapshots use these rates; all other pairs use latest rate
 * - Retention: 1 year (cleanup job)
 */
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const exchangeRates = sqliteTable(
  'exchange_rates',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    base_currency: text('base_currency', { length: 3 }).notNull(), // 'USD' or 'HKD'
    target_currency: text('target_currency', { length: 3 }).notNull(), // 'CNY'
    rate: text('rate').notNull(), // Decimal string (e.g., '7.2345')

    rate_date: text('rate_date').notNull(), // ISO date YYYY-MM-DD
    fetched_at: text('fetched_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    source: text('source').notNull(), // e.g., 'exchangerate-api.com'

    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    currencyDateIdx: index('idx_currency_date').on(
      table.base_currency,
      table.target_currency,
      table.rate_date
    ),
    rateDateIdx: index('idx_rate_date').on(table.rate_date),
  })
)

export type ExchangeRateRow = typeof exchangeRates.$inferSelect
export type InsertExchangeRateRow = typeof exchangeRates.$inferInsert
