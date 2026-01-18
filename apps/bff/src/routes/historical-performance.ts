import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type { HistoricalPerformance } from '@repo/shared-types';
import { requireAuth } from '../middleware/auth';
import { portfolios, portfolioHistories, users } from '../db/schema';
import { fromMoney4, roundMoney4 } from '../lib/money';
import { toIsoDateInTimeZone } from '../lib/time';
import { ExchangeRateService } from '../services/exchange-rate-service';

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displayCurrency: z.string().min(3).max(8).optional(),
});

export const historicalPerformanceRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

historicalPerformanceRoutes.get('/:portfolioId', requireAuth(), zValidator('query', querySchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const q = c.req.valid('query');

  const displayCurrency = q.displayCurrency ?? 'CNY';

  const db = c.get('db');
  const owned = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const timeZone = user[0]?.timeZone ?? 'UTC';

  const startIso = new Date(`${q.startDate}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${q.endDate}T23:59:59.999Z`).toISOString();

  const rows = await db
    .select()
    .from(portfolioHistories)
    .where(and(eq(portfolioHistories.portfolioId, portfolioId), gte(portfolioHistories.timestampUtc, startIso), lte(portfolioHistories.timestampUtc, endIso)))
    .orderBy(asc(portfolioHistories.timestampUtc));

  const byDay = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const day = toIsoDateInTimeZone(r.timestampUtc, timeZone);
    byDay.set(day, r);
  }

  const days = [...byDay.keys()].sort();
  const fx = new ExchangeRateService(db);

  const snapshots: HistoricalPerformance['snapshots'] = [];
  let cumulative = 1;
  const dailyReturns: number[] = [];

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const r = byDay.get(day);
    if (!r) continue;

    const totalValueCny = fromMoney4(r.totalValueCny4);
    const dailyProfitCny = fromMoney4(r.dailyProfitCny4);

    const prev = i > 0 ? byDay.get(days[i - 1]) : undefined;
    const prevTotalValueCny = prev ? fromMoney4(prev.totalValueCny4) : totalValueCny;

    const dailyReturnRate = prevTotalValueCny > 0 ? dailyProfitCny / prevTotalValueCny : 0;
    dailyReturns.push(dailyReturnRate);
    cumulative *= 1 + dailyReturnRate;

    const totalValue = roundMoney4(await fx.convertMoney(totalValueCny, 'CNY', displayCurrency, day));
    const dailyProfit = roundMoney4(await fx.convertMoney(dailyProfitCny, 'CNY', displayCurrency, day));

    snapshots.push({
      date: day,
      totalValue,
      dailyProfit,
      cumulativeReturn: roundMoney4((cumulative - 1) * 100),
    });
  }

  const totalReturn = snapshots.length > 0 ? snapshots[snapshots.length - 1].cumulativeReturn : 0;
  const volatility = roundMoney4(annualizedVolatility(dailyReturns) * 100);

  const response: HistoricalPerformance = {
    portfolioId,
    startDate: q.startDate,
    endDate: q.endDate,
    currency: displayCurrency,
    snapshots,
    totalReturn,
    volatility,
  };

  return c.json(response);
});

function annualizedVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => {
      const d = r - mean;
      return sum + d * d;
    }, 0) /
    (dailyReturns.length - 1);
  const stdev = Math.sqrt(variance);
  return stdev * Math.sqrt(252);
}

