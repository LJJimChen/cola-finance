
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { portfolioHistories, portfolios, user } from '../../db/schema';
import { toMoney4 } from '../../lib/money';
import { createAuth } from '../../lib/auth';
import { eq } from 'drizzle-orm';

describe('Historical Performance Edge Cases', () => {
  it('handles timezone boundaries correctly', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    
    // Create user and session
    const auth = createAuth(db);
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email: 'tz@example.com',
        password: 'password123',
        name: 'Timezone User',
      }
    });
    const signInRes = await auth.api.signInEmail({
      body: {
        email: 'tz@example.com',
        password: 'password123',
      }
    });
    
    const userId = signInRes!.user.id;
    const token = signInRes!.token;
    
    const portfolioId = 'portfolio-tz';
    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Record at 2024-01-01 11:00:00 UTC
    // In Pacific/Kiritimati (+14), this is 2024-01-02 01:00:00
    // If user requests 2024-01-02, this record SHOULD be included.
    await db.insert(portfolioHistories).values({
      id: 'h1',
      portfolioId,
      timestampUtc: '2024-01-01T11:00:00Z',
      totalValueCny4: toMoney4(100),
      dailyProfitCny4: toMoney4(0),
      currentTotalProfitCny4: toMoney4(0),
    });

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);

    // Set user timezone header to Pacific/Kiritimati
    const res = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-02&endDate=2024-01-02&displayCurrency=CNY`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Timezone': 'Pacific/Kiritimati',
        },
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json<any>();
    
    // Should have 1 snapshot for 2024-01-02
    expect(data.snapshots).toHaveLength(1);
    expect(data.snapshots[0].date).toBe('2024-01-02');
  });

  it('calculates daily return correctly for the first day', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    
    const auth = createAuth(db);
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email: 'return@example.com',
        password: 'password123',
        name: 'Return User',
      }
    });
    const signInRes = await auth.api.signInEmail({
      body: {
        email: 'return@example.com',
        password: 'password123',
      }
    });
    
    const userId = signInRes!.user.id;
    const token = signInRes!.token;
    const portfolioId = 'portfolio-return';

    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Day 1: End Value 110, Profit 10.
    // Start Value = 100. Return should be 10/100 = 10%.
    // Cumulative return = 10%.
    await db.insert(portfolioHistories).values({
      id: 'h1',
      portfolioId,
      timestampUtc: '2024-01-01T12:00:00Z',
      totalValueCny4: toMoney4(110),
      dailyProfitCny4: toMoney4(10),
      currentTotalProfitCny4: toMoney4(10),
    });

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);

    const res = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-01&endDate=2024-01-01&displayCurrency=CNY`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect(res.status).toBe(200);
    const data = await res.json<any>();
    
    expect(data.snapshots).toHaveLength(1);
    // cumulativeReturn is (cumulative - 1) * 100
    // cumulative = 1 * (1 + 0.1) = 1.1
    // result = 10
    expect(data.snapshots[0].cumulativeReturn).toBe(10);
  });

  it('prioritizes API header timezone over default', async () => {
    const { db } = await createTestDb();
    const now = new Date().toISOString();
    
    // Create user and session
    const auth = createAuth(db);
    const signUpRes = await auth.api.signUpEmail({
      body: {
        email: 'tz_override@example.com',
        password: 'password123',
        name: 'Timezone Override User',
      }
    });
    const signInRes = await auth.api.signInEmail({
      body: {
        email: 'tz_override@example.com',
        password: 'password123',
      }
    });
    
    const userId = signInRes!.user.id;
    const token = signInRes!.token;
    
    // No timezone setting in DB anymore

    const portfolioId = 'portfolio-tz-override';
    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'P',
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Record at 2024-01-01 23:00:00 UTC
    // In UTC, this is 2024-01-01.
    // In UTC+8 (Asia/Shanghai), this is 2024-01-02 07:00:00.
    await db.insert(portfolioHistories).values({
      id: 'h1',
      portfolioId,
      timestampUtc: '2024-01-01T23:00:00Z',
      totalValueCny4: toMoney4(100),
      dailyProfitCny4: toMoney4(0),
      currentTotalProfitCny4: toMoney4(0),
    });

    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);

    // Case 1: No timezone header -> Uses UTC (default) -> Date is 2024-01-01
    // Request range 2024-01-02 to 2024-01-02. Should be empty.
    const res1 = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-02&endDate=2024-01-02&displayCurrency=CNY`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data1 = await res1.json<any>();
    expect(data1.snapshots).toHaveLength(0);

    // Case 2: With X-Timezone=Asia/Shanghai -> Uses UTC+8 -> Date is 2024-01-02
    // Request range 2024-01-02 to 2024-01-02. Should include the record.
    const res2 = await app.request(
      `/api/historical-performance/${portfolioId}?startDate=2024-01-02&endDate=2024-01-02&displayCurrency=CNY`,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Timezone': 'Asia/Shanghai' 
        } 
      }
    );
    expect(res2.status).toBe(200);
    const data2 = await res2.json<any>();
    expect(data2.snapshots).toHaveLength(1);
    expect(data2.snapshots[0].date).toBe('2024-01-02');
  });
});
