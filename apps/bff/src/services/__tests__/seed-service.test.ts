import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { seedNewUser } from '../seed-service';
import { portfolios, categories, assets, exchangeRates, portfolioHistories, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { fromQuantity8 } from '../../lib/money';

describe('Seed Service', () => {
  it('seeds default data for new user', async () => {
    const { db } = await createTestDb();
    const userId = 'test-user-id';
    const now = new Date().toISOString();

    // Create user first to satisfy FK constraints
    await db.insert(user).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    });

    await seedNewUser(db, { userId, now });

    // Check Portfolios
    const allPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    expect(allPortfolios).toHaveLength(1); // Only Main Portfolio
    expect(allPortfolios[0].name).toBe('Main Portfolio');

    // Check Categories
    const allCategories = await db.select().from(categories);
    // Main Portfolio has 6 cats (US, China, Bonds, Japan, Global Tech, Cash)
    expect(allCategories.length).toBe(6);

    // Check Assets
    const allAssets = await db.select().from(assets);
    // Manual (5) + ETFs (7) + Cash (1) = 13
    expect(allAssets).toHaveLength(13);

    // Check Exchange Rates
    const rates = await db.select().from(exchangeRates);
    expect(rates.length).toBeGreaterThanOrEqual(6);
    
    // Verify asset data integrity (sample)
    const aapl = allAssets.find(a => a.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    // 5000 CNY max allocation / (175 USD * 7.2 Rate) = 3.96 -> 3
    expect(fromQuantity8(aapl?.quantity8 ?? 0)).toBe(3);
    expect(aapl?.brokerAccount).toBe('U1234567');

    // Verify Portfolio History
    const mainPortfolio = allPortfolios[0];
    const history = await db.select().from(portfolioHistories).where(eq(portfolioHistories.portfolioId, mainPortfolio.id));
    expect(history.length).toBeGreaterThan(0);
  });
});
