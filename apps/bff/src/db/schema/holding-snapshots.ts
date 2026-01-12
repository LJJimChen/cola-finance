/**
 * Holding Snapshots table schema (Drizzle ORM)
 *
 * Intent: Historical daily snapshots of holdings for performance tracking.
 * Contracts (from data-model.md):
 * - snapshot_at <= created_at (validated at app layer)
 * - quantity/value fields as decimal strings (validated at app layer)
 * - Foreign keys: holding_id (cascade), user_id (cascade)
 */
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { holdings } from './holdings'
import { users } from './users'

export const holdingSnapshots = sqliteTable(
  'holding_snapshots',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    holding_id: text('holding_id')
      .notNull()
      .references(() => holdings.id, { onDelete: 'cascade' }),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    quantity: text('quantity').notNull(),
    market_value: text('market_value').notNull(),
    cost_basis: text('cost_basis'),
    currency: text('currency', { length: 3 }).notNull(),

    snapshot_at: text('snapshot_at').notNull(),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    holdingSnapshotIdx: index('idx_holding_snapshot').on(table.holding_id, table.snapshot_at),
    userSnapshotIdx: index('idx_user_snapshot').on(table.user_id, table.snapshot_at),
  })
)

export type HoldingSnapshotRow = typeof holdingSnapshots.$inferSelect
export type InsertHoldingSnapshotRow = typeof holdingSnapshots.$inferInsert
