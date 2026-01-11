/**
 * Drizzle ORM configuration for Cloudflare D1
 * 
 * Intent: Configure database schema management and migrations
 * 
 * Contract:
 * - Generates migrations in ./drizzle directory
 * - Schema files in src/db/schema/
 * - SQLite dialect for Cloudflare D1
 */
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/*.ts',
  out: './drizzle',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'cola-finance-db',
  },
} satisfies Config
