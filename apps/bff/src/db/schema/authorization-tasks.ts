/**
 * Authorization Tasks table schema (Drizzle ORM)
 *
 * Intent: Persist xstate snapshots and human-in-the-loop metadata for broker authorization flows.
 * Contracts (from data-model.md):
 * - status in ['pending','in_progress','paused','completed','failed','expired']
 * - verification_type in ['captcha','2fa','consent', null]
 * - connection_id is set when completed; error_code/message when failed (enforced at app layer)
 * - expires_at > created_at (validated at app layer)
 */
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { brokers } from './brokers'
import { brokerConnections } from './broker-connections'

export const authorizationTasks = sqliteTable(
  'authorization_tasks',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    broker_id: text('broker_id')
      .notNull()
      .references(() => brokers.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['pending', 'in_progress', 'paused', 'completed', 'failed', 'expired'],
    })
      .notNull()
      .default('pending'),
    state_snapshot: text('state_snapshot').notNull(),

    verification_url: text('verification_url'),
    verification_type: text('verification_type', {
      enum: ['captcha', '2fa', 'consent'],
    }),

    connection_id: text('connection_id').references(() => brokerConnections.id, {
      onDelete: 'set null',
    }),
    error_code: text('error_code'),
    error_message: text('error_message'),

    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    expires_at: text('expires_at').notNull(),
    completed_at: text('completed_at'),
  },
  (table) => ({
    statusIdx: index('idx_auth_tasks_status').on(table.status),
    expiryIdx: index('idx_auth_tasks_expires').on(table.expires_at),
    userBrokerIdx: index('idx_auth_tasks_user_broker').on(table.user_id, table.broker_id),
  })
)

export type AuthorizationTaskRow = typeof authorizationTasks.$inferSelect
export type InsertAuthorizationTaskRow = typeof authorizationTasks.$inferInsert
