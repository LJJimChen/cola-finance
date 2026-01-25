
import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { account, assets, categories, portfolioHistories, portfolios, session, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { toMoney4 } from '../../lib/money';

describe('User Deletion Cascade', () => {
  it('should delete all related data when user is deleted', async () => {
    const { db } = await createTestDb();
    const userId = 'user-to-delete';
    const portfolioId = 'portfolio-1';

    // 1. Setup Data
    await db.insert(user).values({
      id: userId,
      name: 'Delete Me',
      email: 'delete@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(session).values({
      id: 'session-1',
      userId,
      token: 'token-1',
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(account).values({
      id: 'account-1',
      userId,
      accountId: 'acc-1',
      providerId: 'google',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(portfolios).values({
      id: portfolioId,
      userId,
      name: 'Portfolio 1',
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(categories).values({
      id: 'cat-1',
      portfolioId,
      name: 'Cat 1',
      targetAllocationBps: 0,
      currentAllocationBps: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(assets).values({
      id: 'asset-1',
      portfolioId,
      symbol: 'AAPL',
      name: 'Apple',
      quantity: 1,
      costBasis4: 0,
      dailyProfit4: 0,
      currentPrice4: 0,
      currency: 'USD',
      brokerSource: 'manual',
      brokerAccount: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.insert(portfolioHistories).values({
      id: 'hist-1',
      portfolioId,
      timestampUtc: new Date().toISOString(),
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
    });

    // Verify data exists
    expect(await db.select().from(user).where(eq(user.id, userId))).toHaveLength(1);
    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(1);
    expect(await db.select().from(account).where(eq(account.userId, userId))).toHaveLength(1);
    expect(await db.select().from(portfolios).where(eq(portfolios.userId, userId))).toHaveLength(1);
    expect(await db.select().from(categories).where(eq(categories.portfolioId, portfolioId))).toHaveLength(1);
    expect(await db.select().from(assets).where(eq(assets.portfolioId, portfolioId))).toHaveLength(1);
    expect(await db.select().from(portfolioHistories).where(eq(portfolioHistories.portfolioId, portfolioId))).toHaveLength(1);

    // 2. Delete User
    await db.delete(user).where(eq(user.id, userId));

    // 3. Verify Deletion
    expect(await db.select().from(user).where(eq(user.id, userId))).toHaveLength(0);
    // Cascade checks
    expect(await db.select().from(session).where(eq(session.userId, userId))).toHaveLength(0);
    expect(await db.select().from(account).where(eq(account.userId, userId))).toHaveLength(0);
    expect(await db.select().from(portfolios).where(eq(portfolios.userId, userId))).toHaveLength(0);
    expect(await db.select().from(categories).where(eq(categories.portfolioId, portfolioId))).toHaveLength(0);
    expect(await db.select().from(assets).where(eq(assets.portfolioId, portfolioId))).toHaveLength(0);
    expect(await db.select().from(portfolioHistories).where(eq(portfolioHistories.portfolioId, portfolioId))).toHaveLength(0);
  });
});
