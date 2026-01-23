import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { seedNewUser } from '../seed-service';
import { portfolios, categories, assets, exchangeRates, portfolioHistories } from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Seed Service', () => {
  it('seeds default data for new user', async () => {
    const { db } = await createTestDb();
    const userId = 'test-user-id';
    const now = new Date().toISOString();

    await seedNewUser(db, { userId, now });

    // Check Portfolios
    const allPortfolios = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    expect(allPortfolios).toHaveLength(3); // 2 default + 1 ETF
    expect(allPortfolios.map(p => p.name)).toContain('Main Portfolio');
    expect(allPortfolios.map(p => p.name)).toContain('Growth Bets');
    expect(allPortfolios.map(p => p.name)).toContain('ETF Portfolio');

    // Check Categories
    const allCategories = await db.select().from(categories);
    // Main Portfolio has 3 cats, Growth has 2. ETF has 1. Total 6.
    expect(allCategories.length).toBe(6);

    // Check Assets
    const allAssets = await db.select().from(assets);
    // Main has 5, Growth has 3. ETF has 7. Total 15.
    expect(allAssets).toHaveLength(15);

    // Check Exchange Rates
    const rates = await db.select().from(exchangeRates);
    expect(rates.length).toBeGreaterThanOrEqual(6);
    
    // Verify asset data integrity (sample)
    const aapl = allAssets.find(a => a.symbol === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl?.quantity).toBe(15);
    expect(aapl?.brokerAccount).toBe('U1234567');

    // Verify ETF Portfolio History
    const etfPortfolio = allPortfolios.find(p => p.name === 'ETF Portfolio');
    expect(etfPortfolio).toBeDefined();
    
    if (etfPortfolio) {
      const history = await db.select().from(portfolioHistories).where(eq(portfolioHistories.portfolioId, etfPortfolio.id));
      expect(history.length).toBeGreaterThan(0);
      // Check that history is sorted by time if we were to query it that way, 
      // but here just check we have data points.
      // The CSVs have data from at least 2025-04-16 (from Read output)
      // Wait, 2025? Today is 2026-01-23. The data seems recent or future relative to file creation?
      // Ah, the file content I read showed "2025-04-16".
      // Let's just verify count.
    }
  });
});
