import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PortfolioServiceImpl } from '../services/portfolio-service';
import { db } from '../db';
import { portfolios, assets, categories } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Mock the database
vi.mock('../db', () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// Mock the schema
vi.mock('../db/schema', () => {
  return {
    portfolios: {},
    assets: {},
    categories: {},
    portfolioHistories: {},
  };
});

// Mock drizzle-orm
vi.mock('drizzle-orm', async () => {
  const actual = await import('drizzle-orm');
  return {
    ...actual,
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
    sum: vi.fn(),
    avg: vi.fn(),
  };
});

describe('PortfolioService', () => {
  let portfolioService: PortfolioServiceImpl;

  beforeEach(() => {
    portfolioService = new PortfolioServiceImpl();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculatePortfolioMetrics', () => {
    it('should calculate portfolio metrics correctly', async () => {
      // Mock database response
      const mockAssets = [
        {
          id: 'asset-1',
          userId: 'user-1',
          portfolioId: 'portfolio-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 10,
          costBasis: 150.25,
          dailyProfit: 25.50,
          currentPrice: 175.75,
          currency: 'USD',
          brokerSource: 'BrokerA',
          categoryId: 'category-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'asset-2',
          userId: 'user-1',
          portfolioId: 'portfolio-1',
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          quantity: 5,
          costBasis: 300.00,
          dailyProfit: 18.25,
          currentPrice: 360.50,
          currency: 'USD',
          brokerSource: 'BrokerA',
          categoryId: 'category-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the db.select call
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockAssets),
      });

      const result = await portfolioService.calculatePortfolioMetrics('portfolio-1');

      // Calculate expected values
      const expectedTotalValue = (10 * 175.75) + (5 * 360.50); // 1757.5 + 1802.5 = 3560
      const expectedDailyProfit = 25.50 + 18.25; // 43.75
      const expectedTotalProfit = expectedDailyProfit; // Using daily profit as proxy for current profit

      expect(result.totalValueCny).toBe(expectedTotalValue);
      expect(result.dailyProfitCny).toBe(expectedDailyProfit);
      expect(result.currentTotalProfitCny).toBe(expectedTotalProfit);
    });

    it('should return zero values for empty portfolio', async () => {
      // Mock empty database response
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      const result = await portfolioService.calculatePortfolioMetrics('portfolio-1');

      expect(result.totalValueCny).toBe(0);
      expect(result.dailyProfitCny).toBe(0);
      expect(result.currentTotalProfitCny).toBe(0);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data for valid user and portfolio', async () => {
      // Mock portfolio data
      const mockPortfolio = [{
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'My Portfolio',
        description: 'Main portfolio',
        totalValueCny: 125000.50,
        dailyProfitCny: 1250.75,
        currentTotalProfitCny: 25000.25,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      // Mock assets data
      const mockAssets = [
        {
          id: 'asset-1',
          userId: 'user-1',
          portfolioId: 'portfolio-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 10,
          costBasis: 150.25,
          dailyProfit: 25.50,
          currentPrice: 175.75,
          currency: 'USD',
          brokerSource: 'BrokerA',
          categoryId: 'category-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock categories data
      const mockCategories = [
        {
          id: 'category-1',
          userId: 'user-1',
          name: 'US Equities',
          targetAllocation: 60.00,
          currentAllocation: 62.50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock the db.select calls
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce(mockPortfolio) // First call for portfolio
          .mockResolvedValueOnce(mockAssets) // Second call for assets
          .mockResolvedValueOnce(mockCategories), // Third call for categories
      });

      const result = await portfolioService.getDashboardData('user-1', 'portfolio-1', 'USD');

      expect(result.totalValue).toBeDefined();
      expect(result.dailyProfit).toBeDefined();
      expect(result.annualReturn).toBeDefined();
      expect(result.currency).toBe('USD');
      expect(result.allocationByCategory).toBeDefined();
      expect(Array.isArray(result.topPerformingAssets)).toBe(true);
    });

    it('should throw error for invalid user/portfolio combination', async () => {
      // Mock empty portfolio result (user doesn't own this portfolio)
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      });

      await expect(
        portfolioService.getDashboardData('user-1', 'portfolio-2', 'USD')
      ).rejects.toThrow('Portfolio not found or access denied');
    });
  });
});