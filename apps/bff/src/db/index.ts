import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDbBindings(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema });
}

export type DbBindings = ReturnType<typeof createDbBindings>;