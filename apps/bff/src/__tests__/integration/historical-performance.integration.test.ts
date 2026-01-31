import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { portfolioHistories, exchangeRates, portfolios } from '../../db/schema';
import { toMoney4, toRate8 } from '../../lib/money';
import { toAppError } from '../../lib/errors';
import { createAuth } from '../../lib/auth';

describe('Historical Performance API', () => {
  it('returns historical data with currency conversion and correct fallback', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    
    // Create user and session
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

    // Seed history
    // Day 1: 2024-01-01
    await db.insert(portfolioHistories).values({
      id: 'h1',
      portfolioId,
      timestamp: new Date('2024-01-01T10:00:00Z'),
      totalValueCny4: toMoney4(7000),
      dailyProfitCny4: toMoney4(100),
      currentTotalProfitCny4: toMoney4(100),
    });
    // Day 2: 2024-01-02
    await db.insert(portfolioHistories).values({
      id: 'h2',
      portfolioId,
      timestamp: new Date('2024-01-02T10:00:00Z'),
      totalValueCny4: toMoney4(7100),
      dailyProfitCny4: toMoney4(100),
      currentTotalProfitCny4: toMoney4(200),
    });
    // Day 3: 2024-01-03
    await db.insert(portfolioHistories).values({
      id: 'h3',
      portfolioId,
      timestamp: new Date('2024-01-03T10:00:00Z'),
      totalValueCny4: toMoney4(7200),
      dailyProfitCny4: toMoney4(100),
      currentTotalProfitCny4: toMoney4(300),
    });

    // Seed exchange rates
    // 2024-01-01: 1 USD = 7.0 CNY
    await db.insert(exchangeRates).values({
      id: 'fx1',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.0),
      date: new Date('2024-01-01'),
      createdAt: new Date(now),
    });
    // 2024-01-03: 1 USD = 7.2 CNY
    // Day 2 should use Day 1 rate (7.0)
    await db.insert(exchangeRates).values({
      id: 'fx2',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.2),
      date: new Date('2024-01-03'),
      createdAt: new Date(now),
    });

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);
    app.onError((err, c) => {
      const e = toAppError(err);
      return c.json(e.toResponse(), e.status as ContentfulStatusCode);
    });

    const res = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-01&endDate=2024-01-03&displayCurrency=USD`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.snapshots).toHaveLength(3);
    
    // Day 1: 7000 CNY / 7.0 = 1000 USD
    expect(data.snapshots[0].date).toBe('2024-01-01');
    expect(data.snapshots[0].totalValue).toBe(1000);

    // Day 2: 7100 CNY / 7.0 (fallback) = 1014.2857 -> 1014.29
    expect(data.snapshots[1].date).toBe('2024-01-02');
    expect(data.snapshots[1].totalValue).toBeCloseTo(1014.29, 2);

    // Day 3: 7200 CNY / 7.2 = 1000 USD
    expect(data.snapshots[2].date).toBe('2024-01-03');
    expect(data.snapshots[2].totalValue).toBe(1000);
  });

  it('handles missing rates gracefully (returns 422)', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    
    // Create user and session
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
    
    const token = signInRes!.token;
    const portfolioId = 'portfolio-1';
    const userId = signInRes!.user.id;

    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      totalValueCny4: toMoney4(0),
      dailyProfitCny4: toMoney4(0),
      currentTotalProfitCny4: toMoney4(0),
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);

    const res = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-01&endDate=2024-01-03&displayCurrency=XYZ`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(res.status).toBe(422);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe('MISSING_EXCHANGE_RATE');
  });
});
