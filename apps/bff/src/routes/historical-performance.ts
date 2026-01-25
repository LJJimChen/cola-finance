import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type { HistoricalPerformance } from '@repo/shared-types';
import { requireAuth } from '../middleware/auth';
import { portfolios, portfolioHistories, user } from '../db/schema';
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
  // Read timezone from header, fallback to UTC
  const timeZone = c.req.header('X-Timezone') ?? 'UTC';

  const db = c.get('db');
  const owned = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  const startIso = new Date(`${q.startDate}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${q.endDate}T23:59:59.999Z`).toISOString();

  // Extend query range by 24h to cover all timezones (e.g. UTC-12 to UTC+14)
  const queryStart = new Date(new Date(startIso).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const queryEnd = new Date(new Date(endIso).getTime() + 24 * 60 * 60 * 1000).toISOString();

  const rows = await db
    .select()
    .from(portfolioHistories)
    .where(and(eq(portfolioHistories.portfolioId, portfolioId), gte(portfolioHistories.timestampUtc, queryStart), lte(portfolioHistories.timestampUtc, queryEnd)))
    .orderBy(asc(portfolioHistories.timestampUtc));

  const byDay = new Map<string, typeof rows[number]>();
  for (const r of rows) {
    const day = toIsoDateInTimeZone(r.timestampUtc, timeZone);
    byDay.set(day, r);
  }

  const days = [...byDay.keys()].sort().filter((d) => d >= q.startDate && d <= q.endDate);
  const fx = new ExchangeRateService(db);
  
  // Optimization: Pre-fetch exchange rates to avoid N+1 queries in the loop
  let rates: { date: string; rate: number }[] = [];
  if (displayCurrency !== 'CNY') {
    rates = await fx.getRatesForCurrencyPair(displayCurrency, 'CNY');

    if (rates.length === 0) {
      return c.json({ 
        error: { 
          code: 'MISSING_EXCHANGE_RATE', 
          message: `Missing exchange rate for ${displayCurrency}->CNY` 
        } 
      }, 422);
    }
  }

  const snapshots: HistoricalPerformance['snapshots'] = [];
  let cumulative = 1;
  const dailyReturns: number[] = [];

  let rateIndex = 0;
  let currentRate: number | null = null;
  // Fallback to the absolute latest rate if no past rate is available (matching ExchangeRateService logic)
  const absoluteLatestRate = rates.length > 0 ? rates[rates.length - 1].rate : null;

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const r = byDay.get(day);
    if (!r) continue;

    const totalValueCny = fromMoney4(r.totalValueCny4);
    const dailyProfitCny = fromMoney4(r.dailyProfitCny4);

    // Calculate basis: Start Value = End Value - Profit
    // This correctly handles the case where there is no previous day (first day)
    // and also handles deposits/withdrawals correctly (assuming profit is strictly PnL)
    const basisCny = totalValueCny - dailyProfitCny;

    const dailyReturnRate = basisCny > 0 ? dailyProfitCny / basisCny : 0;
    dailyReturns.push(dailyReturnRate);
    cumulative *= 1 + dailyReturnRate;

    // Convert currency
    let totalValue = totalValueCny;
    let dailyProfit = dailyProfitCny;

    if (displayCurrency !== 'CNY') {
      // Update current rate based on day
      // Since days are sorted ascending, we can advance the rate index
      while (rateIndex < rates.length && rates[rateIndex].date <= day) {
        currentRate = rates[rateIndex].rate;
        rateIndex++;
      }

      const effectiveRate = currentRate ?? absoluteLatestRate;
      
      if (effectiveRate) {
        // Convert CNY -> DisplayCurrency (e.g. USD)
        // Rate is Source(USD) -> Target(CNY)
        // So 1 USD = Rate CNY => 1 CNY = 1/Rate USD
        totalValue = totalValueCny / effectiveRate;
        dailyProfit = dailyProfitCny / effectiveRate;
      }
    }

    snapshots.push({
      date: day,
      totalValue: roundMoney4(totalValue),
      dailyProfit: roundMoney4(dailyProfit),
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

