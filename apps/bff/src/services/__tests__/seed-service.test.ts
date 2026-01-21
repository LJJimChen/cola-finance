import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { seedNewUser } from '../seed-service';
import { portfolios, categories, assets, exchangeRates } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Seed Service', () => {
  it('seeds default data for new user', async () => {
    const { db } = await createTestDb();
    const userId = 'test-user-id';
    const now = new Date().toISOString();

    await seedNewUser(db, { userId, now });

    // Check Portfolios
    const allPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    expect(allPortfolios).toHaveLength(2);
    expect(allPortfolios.map(p => p.name)).toContain('Main Portfolio');
    expect(allPortfolios.map(p => p.name)).toContain('Growth Bets');

    // Check Categories
    const allCategories = await db.select().from(categories);
    // Main Portfolio has 3 cats, Growth has 2. Total 5.
    // Note: Since category names are reused (e.g. US Equities could be in multiple portfolios potentially, 
    // but here they are distinct sets in the seed data), we just check count.
    expect(allCategories.length).toBe(5);

    // Check Assets
    const allAssets = await db.select().from(assets);
    // Main has 5, Growth has 3. Total 8.
    expect(allAssets).toHaveLength(8);

    // Check Exchange Rates
    const rates = await db.select().from(exchangeRates);
    expect(rates.length).toBeGreaterThanOrEqual(6);
    
    // Verify asset data integrity (sample)
    const aapl = allAssets.find(a => a.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl?.quantity).toBe(15);
    expect(aapl?.brokerAccount).toBe('U1234567');
  });
});
