/**
 * Collection Tasks table schema (Drizzle ORM)
 *
 * Intent: Track portfolio refresh jobs and their outcomes.
 * Contracts (from data-model.md):
 * - status in ['pending','in_progress','completed','failed','partial']
 * - holdings_collected / holdings_failed >= 0 (integers)
 * - partial_reason required when status = 'partial' (validated at app layer)
 * - error_code/message required when status = 'failed' (validated at app layer)
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { brokerConnections } from './broker-connections'

export const collectionTasks = sqliteTable(
  'collection_tasks',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    connection_id: text('connection_id')
      .notNull()
      .references(() => brokerConnections.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'in_progress', 'completed', 'failed', 'partial'],
    })
      .notNull()
      .default('pending'),
    state_snapshot: text('state_snapshot').notNull(),

    holdings_collected: integer('holdings_collected').notNull().default(0),
    holdings_failed: integer('holdings_failed').notNull().default(0),
    partial_reason: text('partial_reason'),

    error_code: text('error_code'),
    error_message: text('error_message'),

    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    completed_at: text('completed_at'),
  },
  (table) => ({
    statusIdx: index('idx_collection_tasks_status').on(table.status),
    userCreatedIdx: index('idx_collection_tasks_user_created').on(table.user_id, table.created_at),
  })
)

export type CollectionTaskRow = typeof collectionTasks.$inferSelect
export type InsertCollectionTaskRow = typeof collectionTasks.$inferInsert
