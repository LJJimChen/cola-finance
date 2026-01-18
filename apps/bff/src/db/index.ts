import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema';

export type AppDb = BaseSQLiteDatabase<'async', unknown, typeof schema>;

export function createDb(d1: D1Database): AppDb {
  return drizzle(d1, { schema });
}
