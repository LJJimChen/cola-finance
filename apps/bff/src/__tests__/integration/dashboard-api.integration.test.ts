import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { assets, categories, exchangeRates, portfolios, sessions, users } from '../../db/schema';
import { toMoney4, toRate8 } from '../../lib/money';
import { toAppError } from '../../lib/errors';

describe('Dashboard API', () => {
  it('returns dashboard data for authorized user', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const userId = 'user-1';
    const token = 'token-1';
    const portfolioId = 'portfolio-1';
    const categoryId = 'category-1';

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

    await db.insert(sessions).values({
      id: 'session-1',
      userId,
      token,
      createdAt: now,
      expiresAt: '2099-01-01T00:00:00.000Z',
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

    await db.insert(categories).values({
      id: categoryId,
      userId,
      portfolioId,
      name: 'US equities',
      targetAllocationBps: 10000,
      currentAllocationBps: 0,
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
      categoryId,
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

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);
    app.onError((err, c) => {
      const e = toAppError(err);
      return c.json({ error: { code: e.code, message: e.message } }, e.status);
    });

    const res = await app.request(`/api/portfolios/${portfolioId}/dashboard?displayCurrency=USD`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currency).toBe('USD');
    expect(typeof body.totalValue).toBe('number');
    expect(Array.isArray(body.topPerformingAssets)).toBe(true);
  });

  it('rejects missing authorization', async () => {
    const { db } = await createTestDb();
    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);
    app.onError((err, c) => {
      const e = toAppError(err);
      return c.json({ error: { code: e.code, message: e.message } }, e.status);
    });

    const res = await app.request('/api/portfolios/x/dashboard');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
