import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const rebalancePreviews = sqliteTable('rebalance_previews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  schemeId: text('scheme_id').notNull().references(() => classificationSchemes.id, { onDelete: 'cascade' }),
  targetId: text('target_id').notNull().references(() => targetAllocations.id, { onDelete: 'cascade' }),
  currentAllocation: text('current_allocation', { mode: 'json' }).$type<Record<string, number>>().notNull(), // JSON: { category_id: percentage }
  drift: text('drift', { mode: 'json' }).$type<Record<string, number>>().notNull(), // JSON: { category_id: drift_percentage }
  adjustments: text('adjustments', { mode: 'json' }).$type<Array<{
    category: string;
    action: 'buy' | 'sell';
    amount: number;
  }>>().notNull(), // JSON: [{ category, action: 'buy'|'sell', amount }]
  portfolioValue: text('portfolio_value').notNull(), // Decimal string
  displayCurrency: text('display_currency').notNull(), // ISO 4217 code
  computedAt: text('computed_at').notNull(), // ISO timestamp when preview was generated
  createdAt: text('created_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (table) => ({
  userIdIdx: index('idx_rebalance_previews_user_id').on(table.userId),
  computedAtIdx: index('idx_rebalance_previews_computed_at_desc').on(table.computedAt),
  userIdSchemeIdIdx: index('idx_rebalance_previews_user_scheme').on(table.userId, table.schemeId),
}));
  
// Import needed types/tables
import { users } from './users';
import { classificationSchemes } from './classification-schemes';
import { targetAllocations } from './target-allocations';