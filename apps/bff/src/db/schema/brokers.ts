/**
 * Brokers table schema (Drizzle ORM)
 * 
 * Intent: Define Broker entity database schema
 * Stores metadata about supported broker platforms
 * 
 * Contract:
 * - Primary key: id (slug format, e.g., 'futu', 'tiger')
 * - Seed data loaded via seed script
 * - adapter_version tracks Engine adapter compatibility
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const brokers = sqliteTable('brokers', {
  id: text('id').primaryKey(), // Slug format (e.g., 'futu', 'tiger')
  name: text('name').notNull(),
  name_zh: text('name_zh').notNull(),
  logo_url: text('logo_url').notNull(),
  default_currency: text('default_currency', { length: 3 }).notNull(), // ISO 4217
  supported: integer('supported', { mode: 'boolean' }).notNull().default(true),
  adapter_version: text('adapter_version').notNull(), // Semver (e.g., '1.0.0')
  requires_verification: integer('requires_verification', { mode: 'boolean' })
    .notNull()
    .default(false),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export type BrokerRow = typeof brokers.$inferSelect
export type InsertBrokerRow = typeof brokers.$inferInsert
