import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const targetAllocations = sqliteTable('target_allocations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schemeId: text('scheme_id').notNull().references(() => classificationSchemes.id, { onDelete: 'cascade' }),
  targets: text('targets', { mode: 'json' }).$type<Record<string, number>>().notNull(), // JSON: { "stocks": 60, "bonds": 30, "cash": 10 }
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => ({
  userIdIdx: index('idx_target_allocations_user_id').on(table.userId),
  schemeIdIdx: index('idx_target_allocations_scheme_id').on(table.schemeId),
  userIdSchemeIdUnique: index('idx_target_allocations_user_scheme_unique')
    .on(table.userId, table.schemeId) // This creates a unique constraint
}));

// Import needed types/tables
import { users } from './users';
import { classificationSchemes } from './classification-schemes';