import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { assets, categories, exchangeRates, portfolios, session, user } from '../../db/schema';
import { toMoney4, toRate8, toQuantity8 } from '../../lib/money';
import { toAppError } from '../../lib/errors';
import type { RebalanceRecommendations } from '@repo/shared-types';
import { createAuth } from '../../lib/auth';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { PortfolioMetricsService } from '../../services/portfolio-metrics-service';

describe('Rebalance API', () => {
  it('returns rebalance recommendations for authorized user', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    const today = new Date(now.slice(0, 10));
    
    // Setup user and session via better-auth
    const auth = createAuth(db);
    await auth.api.signUpEmail({
      body: {
        email: 'u@example.com',
        password: 'password123',
        name: 'Test User',
      }
    });

    const signInRes = await auth.api.signInEmail({
      body: {
        email: 'u@example.com',
        password: 'password123',
      }
    });
    
    if (!signInRes || !signInRes.token) {
      throw new Error('Failed to sign in');
    }

    const userId = signInRes.user.id;
    const token = signInRes.token;
    const portfolioId = 'portfolio-1';
    const categoryId1 = 'category-1';
    const categoryId2 = 'category-2';

    // Setup portfolio
    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      description: null,
      totalValueCny4: toMoney4(0),
      dailyProfitCny4: toMoney4(0),
      currentTotalProfitCny4: toMoney4(0),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    // Setup categories
    // Category 1: Target 60%, but will have 100% (Overweight)
    await db.insert(categories).values({
      id: categoryId1,
      // userId, // Removed from schema
      portfolioId,
      name: 'US equities',
      targetAllocationBps: 6000, // 60%
      currentAllocationBps: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    // Category 2: Target 40%, but will have 0% (Underweight)
    await db.insert(categories).values({
      id: categoryId2,
      // userId, // Removed from schema
      portfolioId,
      name: 'Bonds',
      targetAllocationBps: 4000, // 40%
      currentAllocationBps: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    // Setup exchange rate
    // Note: seedNewUser (triggered by signUpEmail) already inserts rates for today.
    // We skip manual insertion to avoid unique constraint violation.
    /*
    await db.insert(exchangeRates).values({
      id: 'fx-usd',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.2),
      date: today,
      createdAt: new Date(now),
    });
    */

    // Setup assets
    // Asset in Category 1 worth $1000 (approx 7200 CNY)
    await db.insert(assets).values({
      id: 'asset-1',
      // userId, // Removed from schema
      portfolioId,
      categoryId: categoryId1,
      symbol: 'AAPL',
      name: 'Apple',
      quantity8: toQuantity8(10),
      costBasis4: toMoney4(100),
      currentPrice4: toMoney4(100),
      dailyProfit4: toMoney4(0),
      currency: 'USD',
      brokerSource: 'mock',
      brokerAccount: 'test-account',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    // Recompute metrics since we bypassed the service layer
    const metrics = new PortfolioMetricsService(db);
    await metrics.recomputeAndPersist(userId, portfolioId);

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);
    app.onError((err, c) => {
      const e = toAppError(err);
      return c.json({ error: { code: e.code, message: e.message } }, e.status as ContentfulStatusCode);
    });

    const res = await app.request(`/api/portfolios/${portfolioId}/rebalance`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as RebalanceRecommendations;
    expect(body.portfolioId).toBe(portfolioId);
    expect(body.recommendations).toHaveLength(2);

    // Check Category 1 (US equities) - Should be Overweight
    // Current allocation: 100% (since only this category has assets)
    // Target: 60%
    // Deviation: +40%
    const cat1Rec = body.recommendations.find(r => r.categoryId === categoryId1);
    expect(cat1Rec).toBeDefined();
    expect(cat1Rec?.currentAllocation).toBeCloseTo(100, 0);
    expect(cat1Rec?.targetAllocation).toBe(60);
    expect(cat1Rec?.deviation).toBeGreaterThan(0);
    expect(cat1Rec?.recommendation).toContain('Overweight');

    // Check Category 2 (Bonds) - Should be Underweight
    // Current allocation: 0%
    // Target: 40%
    // Deviation: -40%
    const cat2Rec = body.recommendations.find(r => r.categoryId === categoryId2);
    expect(cat2Rec).toBeDefined();
    expect(cat2Rec?.currentAllocation).toBe(0);
    expect(cat2Rec?.targetAllocation).toBe(40);
    expect(cat2Rec?.deviation).toBeLessThan(0);
    expect(cat2Rec?.recommendation).toContain('Underweight');
  });
});
