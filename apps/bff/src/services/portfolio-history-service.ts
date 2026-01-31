import type { AppDb } from '../db';
import { portfolioHistories } from '../db/schema';
import { eq, desc, asc, and, gte, lte } from 'drizzle-orm';
import type { PortfolioHistory, HistoricalPerformance } from '@repo/shared-types';
import { fromMoney4, roundMoney4, toMoney4 } from '../lib/money';
import { toIsoDateInTimeZone } from '../lib/time';
import { ExchangeRateService } from './exchange-rate-service';
import { MissingExchangeRateError } from '../lib/errors';
import { randomUUID } from 'node:crypto';

export interface PortfolioHistoryService {
  getLatestSnapshot(portfolioId: string): Promise<PortfolioHistory | null>;
  getSnapshots(portfolioId: string, startDate?: Date, endDate?: Date): Promise<PortfolioHistory[]>;
  createSnapshot(portfolioId: string, data: Omit<PortfolioHistory, 'id'>): Promise<PortfolioHistory>;
  getHistoricalPerformance(
    portfolioId: string,
    startDate: string,
    endDate: string,
    displayCurrency: string,
    timeZone: string
  ): Promise<HistoricalPerformance>;
}

export class PortfolioHistoryServiceImpl implements PortfolioHistoryService {
  constructor(private db: AppDb) {}

  private mapRowToPortfolioHistory(row: typeof portfolioHistories.$inferSelect): PortfolioHistory {
    return {
      id: row.id,
      portfolioId: row.portfolioId,
      timestamp: row.timestamp,
      totalValueCny: fromMoney4(row.totalValueCny4),
      dailyProfitCny: fromMoney4(row.dailyProfitCny4),
      currentTotalProfitCny: fromMoney4(row.currentTotalProfitCny4),
    } as unknown as PortfolioHistory;
  }

  async getLatestSnapshot(portfolioId: string): Promise<PortfolioHistory | null> {
    const result = await this.db
      .select()
      .from(portfolioHistories)
      .where(eq(portfolioHistories.portfolioId, portfolioId))
      .orderBy(desc(portfolioHistories.timestamp))
      .limit(1);

    return result.length > 0 ? this.mapRowToPortfolioHistory(result[0]) : null;
  }

  async getSnapshots(portfolioId: string, startDate?: Date, endDate?: Date): Promise<PortfolioHistory[]> {
    const conditions = [eq(portfolioHistories.portfolioId, portfolioId)];

    if (startDate) {
      conditions.push(gte(portfolioHistories.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(portfolioHistories.timestamp, endDate));
    }

    const result = await this.db
      .select()
      .from(portfolioHistories)
      .where(and(...conditions))
      .orderBy(desc(portfolioHistories.timestamp));

    return result.map(this.mapRowToPortfolioHistory);
  }

  async createSnapshot(portfolioId: string, data: Omit<PortfolioHistory, 'id'>): Promise<PortfolioHistory> {
    const [result] = await this.db
      .insert(portfolioHistories)
      .values({
        id: randomUUID(),
        portfolioId,
        timestamp: data.timestamp,
        totalValueCny4: toMoney4(data.totalValueCny),
        dailyProfitCny4: toMoney4(data.dailyProfitCny),
        currentTotalProfitCny4: toMoney4(data.currentTotalProfitCny),
      })
      .returning();

    return this.mapRowToPortfolioHistory(result);
  }

  async getHistoricalPerformance(
    portfolioId: string,
    startDate: string,
    endDate: string,
    displayCurrency: string,
    timeZone: string
  ): Promise<HistoricalPerformance> {
    // 1. Prepare Date Range for Query
    const startIso = new Date(`${startDate}T00:00:00.000Z`);
    const endIso = new Date(`${endDate}T23:59:59.999Z`);

    // Extend query range by 24h to cover all possible timezones
    const queryStart = new Date(startIso.getTime() - 24 * 60 * 60 * 1000);
    const queryEnd = new Date(endIso.getTime() + 24 * 60 * 60 * 1000);

    // 2. Fetch History Rows
    const rows = await this.db
      .select()
      .from(portfolioHistories)
      .where(and(
        eq(portfolioHistories.portfolioId, portfolioId),
        gte(portfolioHistories.timestamp, queryStart),
        lte(portfolioHistories.timestamp, queryEnd)
      ))
      .orderBy(asc(portfolioHistories.timestamp));

    // 3. Group by Day in User's Timezone
    const byDay = new Map<string, typeof rows[number]>();
    for (const row of rows) {
      const day = toIsoDateInTimeZone(row.timestamp.toISOString(), timeZone);
      byDay.set(day, row);
    }

    // Filter keys to strictly match the requested range
    const days = [...byDay.keys()].sort().filter((d) => d >= startDate && d <= endDate);

    // 4. Prepare Exchange Rates
    const fx = new ExchangeRateService(this.db);
    let rates: { date: string; rate: number }[] = [];
    
    if (displayCurrency !== 'CNY') {
      const rawRates = await fx.getRatesForCurrencyPair(displayCurrency, 'CNY');
      
      rates = rawRates.map(r => ({
        date: r.date.toISOString().slice(0, 10),
        rate: r.rate
      }));

      rates.sort((a, b) => a.date.localeCompare(b.date));

      if (rates.length === 0) {
        throw new MissingExchangeRateError(`Missing exchange rate for ${displayCurrency}->CNY`);
      }
    }

    const snapshots: HistoricalPerformance['snapshots'] = [];
    let cumulative = 1;
    const dailyReturns: number[] = [];

    let rateIndex = 0;
    let currentRate: number | null = null;
    const absoluteLatestRate = rates.length > 0 ? rates[rates.length - 1].rate : null;

    // 5. Calculate Performance Metrics
    for (const day of days) {
      const row = byDay.get(day);
      if (!row) continue;

      const totalValueCny = fromMoney4(row.totalValueCny4);
      const dailyProfitCny = fromMoney4(row.dailyProfitCny4);

      // Simple Dietz: Basis = End - Profit
      const basisCny = totalValueCny - dailyProfitCny;
      const dailyReturnRate = basisCny > 0 ? dailyProfitCny / basisCny : 0;
      
      dailyReturns.push(dailyReturnRate);
      cumulative = cumulative * (1 + dailyReturnRate);

      // Currency Conversion
      let totalValue = totalValueCny;
      let dailyProfit = dailyProfitCny;

      if (displayCurrency !== 'CNY') {
        while (rateIndex < rates.length && rates[rateIndex].date <= day) {
          currentRate = rates[rateIndex].rate;
          rateIndex++;
        }

        const effectiveRate = currentRate ?? absoluteLatestRate;
        
        if (effectiveRate) {
          totalValue = totalValueCny / effectiveRate;
          dailyProfit = dailyProfitCny / effectiveRate;
        }
      }

      snapshots.push({
        date: day as unknown as Date, // Keep as string for JSON serialization to match API contract
        totalValue: roundMoney4(totalValue),
        dailyProfit: roundMoney4(dailyProfit),
        cumulativeReturn: roundMoney4((cumulative - 1) * 100),
      });
    }

    const totalReturn = snapshots.length > 0 ? snapshots[snapshots.length - 1].cumulativeReturn : 0;
    const volatility = roundMoney4(this.annualizedVolatility(dailyReturns) * 100);

    return {
      portfolioId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      currency: displayCurrency,
      snapshots,
      totalReturn,
      volatility,
    };
  }

  private annualizedVolatility(dailyReturns: number[]): number {
    if (dailyReturns.length < 2) return 0;
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance =
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (dailyReturns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252);
  }
}