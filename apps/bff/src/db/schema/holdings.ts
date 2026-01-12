/**
 * Holdings table schema (Drizzle ORM)
 *
 * Intent: Persist current holdings for a broker connection.
 * Contracts (from data-model.md):
 * - instrument_type in ['stock','fund','bond','cash','crypto','other']
 * - currency is ISO 4217 (3 chars)
 * - quantity / value fields stored as decimal strings (validated at app layer)
 * - is_stale = true if last_updated_at older than 24h (computed at app layer)
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { brokerConnections } from './broker-connections'

export const holdings = sqliteTable(
  'holdings',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    connection_id: text('connection_id')
      .notNull()
      .references(() => brokerConnections.id, { onDelete: 'cascade' }),

    symbol: text('symbol').notNull(),
    instrument_type: text('instrument_type', {
      enum: ['stock', 'fund', 'bond', 'cash', 'crypto', 'other'],
    }).notNull(),
    instrument_name: text('instrument_name').notNull(),
    instrument_name_zh: text('instrument_name_zh'),

    quantity: text('quantity').notNull(),
    currency: text('currency', { length: 3 }).notNull(),
    market_value: text('market_value').notNull(),
    cost_basis: text('cost_basis'),
    unrealized_pnl: text('unrealized_pnl'),

    daily_return: text('daily_return'),
    total_return: text('total_return'),

    category: text('category'),
    last_updated_at: text('last_updated_at').notNull(),
    is_stale: integer('is_stale', { mode: 'boolean' }).notNull().default(false),

    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userSymbolIdx: index('idx_holdings_user_symbol').on(table.user_id, table.symbol),
    userCategoryIdx: index('idx_holdings_user_category').on(table.user_id, table.category),
    connectionIdx: index('idx_holdings_connection').on(table.connection_id),
  })
)

export type HoldingRow = typeof holdings.$inferSelect
export type InsertHoldingRow = typeof holdings.$inferInsert
