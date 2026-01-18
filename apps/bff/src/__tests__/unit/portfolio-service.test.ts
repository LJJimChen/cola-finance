import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { assets, exchangeRates, portfolios, users } from '../../db/schema';
import { toMoney4, toRate8 } from '../../lib/money';
import { PortfolioMetricsService } from '../../services/portfolio-metrics-service';
import { eq } from 'drizzle-orm';

describe('PortfolioMetricsService', () => {
  it('recomputes totals using FX rates and persists to portfolios', async () => {
    const { db } = await createTestDb();
    const now = '2026-01-18T00:00:00.000Z';
    const today = '2026-01-18';
    const userId = 'user-1';
    const portfolioId = 'portfolio-1';

    await db.insert(users).values({
      id: userId,
      email: 'u@example.com',
      passwordHash: 'x',
      languagePreference: 'zh',
      themeSettings: 'auto',
      displayCurrency: 'CNY',
      timeZone: 'UTC',
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      description: null,
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(exchangeRates).values({
      id: 'fx-usd',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.2),
      date: today,
      createdAt: now,
    });

    await db.insert(assets).values({
      id: 'asset-1',
      userId,
      portfolioId,
      categoryId: null,
      symbol: 'AAPL',
      name: 'Apple',
      quantity: 10,
      costBasis4: toMoney4(170),
      currentPrice4: toMoney4(190),
      dailyProfit4: toMoney4(12),
      currency: 'USD',
      brokerSource: 'mock',
      createdAt: now,
      updatedAt: now,
    });

    const svc = new PortfolioMetricsService(db);
    const totals = await svc.recomputeAndPersist(userId, portfolioId, { asOfUtc: now });

    expect(totals.totalValueCny).toBeCloseTo(190 * 10 * 7.2, 4);
    expect(totals.dailyProfitCny).toBeCloseTo(12 * 7.2, 4);
    expect(totals.currentTotalProfitCny).toBeCloseTo((190 - 170) * 10 * 7.2, 4);

    const updated = await db.select().from(portfolios).where(eq(portfolios.id, portfolioId)).limit(1);
    expect(updated.length).toBe(1);
    expect(updated[0].totalValueCny4).toBe(toMoney4(totals.totalValueCny));
  });
});
