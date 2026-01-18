import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { exchangeRates } from '../db/schema';
import { fromRate8 } from '../lib/money';

const querySchema = z.object({
  baseCurrency: z.string().min(3).max(8).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const exchangeRateRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
  };
}>();

exchangeRateRoutes.get('/', zValidator('query', querySchema), async (c) => {
  const q = c.req.valid('query');
  const date = q.date ?? new Date().toISOString().slice(0, 10);
  const baseCurrency = q.baseCurrency;

  const db = c.get('db');
  const rows = baseCurrency
    ? await db
        .select()
        .from(exchangeRates)
        .where(and(eq(exchangeRates.sourceCurrency, baseCurrency), eq(exchangeRates.date, date)))
    : await db.select().from(exchangeRates).where(eq(exchangeRates.date, date));

  return c.json(
    rows.map((r) => ({
      id: r.id,
      sourceCurrency: r.sourceCurrency,
      targetCurrency: r.targetCurrency,
      exchangeRate: fromRate8(r.rate8),
      date: r.date,
      createdAt: r.createdAt,
    })),
  );
});

