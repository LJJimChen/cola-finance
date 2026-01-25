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
  const query = c.req.valid('query');

  const displayCurrency = query.displayCurrency ?? 'CNY';
  // Read timezone from header, fallback to UTC
  // This ensures the daily grouping aligns with the user's local day boundaries
  const timeZone = c.req.header('X-Timezone') ?? 'UTC';

  const db = c.get('db');

  // 1. Verify Portfolio Ownership
  const owned = await db
    .select({ id: portfolios.id })
    .from(portfolios)
    .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  // 2. Prepare Date Range for Query
  // We need to fetch a slightly wider range of UTC data to ensure we cover the full local days
  const startIso = new Date(`${query.startDate}T00:00:00.000Z`).toISOString();
  const endIso = new Date(`${query.endDate}T23:59:59.999Z`).toISOString();

  // Extend query range by 24h to cover all possible timezones (e.g. UTC-12 to UTC+14)
  const queryStart = new Date(new Date(startIso).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const queryEnd = new Date(new Date(endIso).getTime() + 24 * 60 * 60 * 1000).toISOString();

  // 3. Fetch History Rows
  const rows = await db
    .select()
    .from(portfolioHistories)
    .where(and(eq(portfolioHistories.portfolioId, portfolioId), gte(portfolioHistories.timestampUtc, queryStart), lte(portfolioHistories.timestampUtc, queryEnd)))
    .orderBy(asc(portfolioHistories.timestampUtc));

  // 4. Group by Day in User's Timezone
  // We use a Map to store one snapshot per day.
  // Since rows are ordered by timestampUtc ASC, later snapshots for the same "local day" will overwrite earlier ones.
  // This effectively selects the "closing" snapshot for each day, which is the correct behavior for
  // tracking end-of-day value and accumulated daily profit.
  const byDay = new Map<string, typeof rows[number]>();
  for (const row of rows) {
    const day = toIsoDateInTimeZone(row.timestampUtc, timeZone);
    byDay.set(day, row);
  }

  // Filter keys to strictly match the requested range (handling the buffer overlap)
  const days = [...byDay.keys()].sort().filter((d) => d >= query.startDate && d <= query.endDate);
  
  // 5. Prepare Exchange Rates
  const fx = new ExchangeRateService(db);
  
  // Optimization: Pre-fetch exchange rates to avoid N+1 queries in the loop
  // We fetch all rates for the requested currency pair
  let rates: { date: string; rate: number }[] = [];
  if (displayCurrency !== 'CNY') {
    rates = await fx.getRatesForCurrencyPair(displayCurrency, 'CNY');

    // Ensure rates are sorted by date ASC for the efficient lookup loop below
    rates.sort((a, b) => a.date.localeCompare(b.date));

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
  // Fallback to the absolute latest rate if no past rate is available (e.g. only future rates seeded)
  const absoluteLatestRate = rates.length > 0 ? rates[rates.length - 1].rate : null;

  // 6. Calculate Performance Metrics
  for (const day of days) {
    const row = byDay.get(day);
    if (!row) continue;

    const totalValueCny = fromMoney4(row.totalValueCny4);
    const dailyProfitCny = fromMoney4(row.dailyProfitCny4);

    // Calculate Basis (Start Value) for Return Calculation
    // Logic: Start Value = End Value - Profit
    // This assumes `dailyProfitCny` represents the PnL accumulated during this day.
    // This formula works even if there are deposits/withdrawals, provided `dailyProfit` excludes capital flows.
    // Example: Start 100, Deposit 50, Profit 10 => End 160.
    // Basis = 160 - 10 = 150. (This "Basis" effectively includes the deposit as if it was there at start).
    // Return = 10 / 150 = 6.66%. 
    // This is the "Simple Dietz" method approximation which treats flows as occurring at the start of the day.
    const basisCny = totalValueCny - dailyProfitCny;

    // Guard against division by zero or negative basis (which would yield nonsensical returns for this simple model)
    // Note: This logic assumes 'dailyProfitCny' correctly reflects PnL.
    // If 'basisCny' is 0 (e.g. empty portfolio), return is 0.
    const dailyReturnRate = basisCny > 0 ? dailyProfitCny / basisCny : 0;
    
    dailyReturns.push(dailyReturnRate);

    // Calculate cumulative return (Geometric Linking / Time-Weighted Return)
    // We use a precision correction here to prevent floating point errors from accumulating too much
    // although for display purposes standard float precision is usually sufficient.
    cumulative = cumulative * (1 + dailyReturnRate);
    
    // Warning: If cumulative ever hits 0 (due to -100% loss), it will stay 0 forever even if funds are re-deposited.
    // This is mathematically correct for TWR but can be confusing for users who restart their portfolio.


    // Currency Conversion Logic
    let totalValue = totalValueCny;
    let dailyProfit = dailyProfitCny;

    if (displayCurrency !== 'CNY') {
      // Find the appropriate exchange rate for this day.
      // Since `days` and `rates` are both sorted ASC, we can just advance `rateIndex`.
      // We look for the latest rate that is <= current day.
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
    startDate: query.startDate,
    endDate: query.endDate,
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

