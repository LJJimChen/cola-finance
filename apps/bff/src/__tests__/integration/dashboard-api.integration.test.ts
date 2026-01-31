import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { assets, categories, exchangeRates, portfolios, session, user } from '../../db/schema';
import { toMoney4, toRate8, toQuantity8 } from '../../lib/money';
import { toAppError } from '../../lib/errors';
import { createAuth } from '../../lib/auth';

import { ContentfulStatusCode } from 'hono/utils/http-status';

describe('Dashboard API', () => {
  it('returns dashboard data for authorized user', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    const today = new Date(now.slice(0, 10));
    
    // Create user and session using better-auth
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

    const sessions = await db.select().from(session);
    console.log('Sessions in DB:', sessions);

    const userId = signInRes.user.id;
    const token = signInRes.token;
    const portfolioId = 'portfolio-1';
    const categoryId = 'category-1';

    // Update user preferences manually if needed (or pass in signUp if supported)
    // For now defaults are fine (zh, auto, CNY, Asia/Shanghai)

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

    await db.insert(categories).values({
      id: categoryId,
      portfolioId,
      name: 'US equities',
      targetAllocationBps: 10000,
      currentAllocationBps: 0,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    // Note: seedNewUser (triggered by signUpEmail) already inserts rates for today.
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

    await db.insert(assets).values({
      id: 'asset-1',
      portfolioId,
      categoryId,
      symbol: 'AAPL',
      name: 'Apple',
      quantity8: toQuantity8(10),
      costBasis4: toMoney4(170),
      currentPrice4: toMoney4(190),
      dailyProfit4: toMoney4(12),
      currency: 'USD',
      brokerSource: 'mock',
      brokerAccount: 'test-account',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

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

    const res = await app.request(`/api/portfolios/${portfolioId}/dashboard?displayCurrency=USD`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Cookie: `better-auth.session_token=${token}`,
        Host: 'localhost:3000',
        Origin: 'http://localhost:3000',
        'User-Agent': 'test-agent'
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
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
      return c.json({ error: { code: e.code, message: e.message } }, e.status as ContentfulStatusCode);
    });

    const res = await app.request('/api/portfolios/x/dashboard');
    expect(res.status).toBe(401);
    const body = await res.json() as any;
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
