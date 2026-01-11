/**
 * Broker Connections table schema (Drizzle ORM)
 * 
 * Intent: Define BrokerConnection entity database schema
 * Represents user's authorized relationship to a broker (NO credentials stored)
 * 
 * Contract:
 * - Primary key: id (UUID)
 * - Foreign keys: user_id, broker_id
 * - Status transitions: active → expired/revoked/failed
 * - NO broker credentials stored (Constitution principle)
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { users } from './users'
import { brokers } from './brokers'

export const brokerConnections = sqliteTable(
  'broker_connections',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    user_id: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    broker_id: text('broker_id')
      .notNull()
      .references(() => brokers.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['active', 'expired', 'revoked', 'failed'],
    })
      .notNull()
      .default('active'),

    // Authorization metadata (NO credentials)
    authorized_at: text('authorized_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    expires_at: text('expires_at'),
    last_refresh_at: text('last_refresh_at'),

    // Error tracking
    consecutive_failures: integer('consecutive_failures').notNull().default(0),
    last_error_code: text('last_error_code'),
    last_error_message: text('last_error_message'),

    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    userBrokerIdx: index('idx_user_broker').on(table.user_id, table.broker_id),
  })
)

export type BrokerConnectionRow = typeof brokerConnections.$inferSelect
export type InsertBrokerConnectionRow = typeof brokerConnections.$inferInsert
