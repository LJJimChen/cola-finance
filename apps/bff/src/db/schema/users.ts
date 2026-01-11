/**
 * Users table schema (Drizzle ORM)
 * 
 * Intent: Define User entity database schema for Cloudflare D1
 * Corresponds to User entity in @cola-finance/schema
 * 
 * Contract:
 * - Primary key: id (UUID)
 * - Unique constraint: email
 * - password_hash never exposed in API responses
 * - Validation enforced at application layer (Zod schemas)
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  email_verified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  password_hash: text('password_hash'),
  display_name: text('display_name'),
  locale: text('locale', { enum: ['en', 'zh'] }).notNull().default('en'),
  display_currency: text('display_currency', { length: 3 }).notNull().default('USD'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  last_login_at: text('last_login_at'),
})

export type UserRow = typeof users.$inferSelect
export type InsertUserRow = typeof users.$inferInsert
