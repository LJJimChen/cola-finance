import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { AppDb } from '.';
import * as schema from './schema';

export async function createTestDb(): Promise<{ db: AppDb; client: Client }> {
  const client = createClient({ url: 'file::memory:' });
  await client.execute('PRAGMA foreign_keys = ON;');
  await createTables(client);
  const db = drizzle(client, { schema });
  return { db, client };
}

async function createTables(client: Client): Promise<void> {
  // better-auth tables
  await client.execute(`CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    language_preference TEXT DEFAULT 'zh',
    theme_settings TEXT DEFAULT 'auto',
    display_currency TEXT DEFAULT 'CNY',
    time_zone TEXT DEFAULT 'Asia/Shanghai'
  );`);

  await client.execute(`CREATE TABLE session (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE account (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
  );`);

  // Existing app tables
  await client.execute(`CREATE TABLE portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_value_cny4 INTEGER NOT NULL,
    daily_profit_cny4 INTEGER NOT NULL,
    current_total_profit_cny4 INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_allocation_bps INTEGER NOT NULL,
    current_allocation_bps INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    category_id TEXT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity8 INTEGER NOT NULL,
    cost_basis4 INTEGER NOT NULL,
    daily_profit4 INTEGER NOT NULL,
    current_price4 INTEGER NOT NULL,
    currency TEXT NOT NULL,
    broker_source TEXT NOT NULL,
    broker_account TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE portfolio_histories (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    total_value_cny4 INTEGER NOT NULL,
    daily_profit_cny4 INTEGER NOT NULL,
    current_total_profit_cny4 INTEGER NOT NULL,
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
  );`);

  await client.execute(`CREATE TABLE exchange_rates (
    id TEXT PRIMARY KEY,
    source_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate8 INTEGER NOT NULL,
    date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );`);

  await client.execute(`CREATE UNIQUE INDEX exchange_rates_unique_idx ON exchange_rates (source_currency, target_currency, date);`);
}
