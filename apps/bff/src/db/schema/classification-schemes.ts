import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const classificationSchemes = sqliteTable('classification_schemes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for preset schemes
  name: text('name').notNull(),
  nameZh: text('name_zh'),
  description: text('description'),
  isPreset: integer('is_preset', { mode: 'boolean' }).default(false).notNull(),
  categories: text('categories', { mode: 'json' }).$type<Array<{
    id: string;
    name: string;
    name_zh?: string;
    rules?: object;
  }>>().notNull(),
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => ({
  isPresetIdx: index('idx_classification_schemes_is_preset').on(table.isPreset),
  userIdIdx: index('idx_classification_schemes_user_id').on(table.userId),
}));

// Import needed types/tables
import { users } from './users';