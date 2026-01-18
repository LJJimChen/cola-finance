import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import type { AppDb } from '.';
import * as schema from './schema';

export async function createTestDb(): Promise<{ db: AppDb; client: Client }> {
  const client = createClient({ url: 'file::memory:' });
  await createTables(client);
  const db = drizzle(client, { schema });
  return { db, client };
}

async function createTables(client: Client): Promise<void> {
  await client.execute(`CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    language_preference TEXT NOT NULL,
    theme_settings TEXT NOT NULL,
    display_currency TEXT NOT NULL,
    time_zone TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);

  await client.execute(`CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );`);

  await client.execute(`CREATE TABLE portfolios (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_value_cny4 INTEGER NOT NULL,
    daily_profit_cny4 INTEGER NOT NULL,
    current_total_profit_cny4 INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);

  await client.execute(`CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    portfolio_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_allocation_bps INTEGER NOT NULL,
    current_allocation_bps INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);

  await client.execute(`CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    portfolio_id TEXT NOT NULL,
    category_id TEXT,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    cost_basis4 INTEGER NOT NULL,
    daily_profit4 INTEGER NOT NULL,
    current_price4 INTEGER NOT NULL,
    currency TEXT NOT NULL,
    broker_source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);

  await client.execute(`CREATE TABLE portfolio_histories (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    timestamp_utc TEXT NOT NULL,
    total_value_cny4 INTEGER NOT NULL,
    daily_profit_cny4 INTEGER NOT NULL,
    current_total_profit_cny4 INTEGER NOT NULL
  );`);

  await client.execute(`CREATE TABLE exchange_rates (
    id TEXT PRIMARY KEY,
    source_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate8 INTEGER NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);
}

