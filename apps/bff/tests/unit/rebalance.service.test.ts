import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RebalanceService } from '../../src/services/rebalance.service';

describe('RebalanceService', () => {
  let rebalanceService: RebalanceService;

  beforeEach(() => {
    // Mock the environment and dependencies
    rebalanceService = new RebalanceService({
      // Mock environment
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);
  });

  describe('calculateCurrentAllocation', () => {
    it('should calculate allocation by category correctly', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          quantity: '10',
          currency: 'USD',
          market_value: '1500',
          category: 'stocks',
          user_id: 'user-1',
          connection_id: 'conn-1',
        },
        {
          id: 'holding-2',
          symbol: '00700.HK',
          instrument_name: 'Tencent',
          quantity: '100',
          currency: 'HKD',
          market_value: '4000',
          category: 'stocks',
          user_id: 'user-1',
          connection_id: 'conn-1',
        },
        {
          id: 'holding-3',
          symbol: 'BOND',
          instrument_name: 'Government Bond',
          quantity: '5',
          currency: 'USD',
          market_value: '5000',
          category: 'bonds',
          user_id: 'user-1',
          connection_id: 'conn-1',
        },
      ];

      const mockScheme = {
        id: 'scheme-1',
        categories: [
          { id: 'stocks', name: 'Stocks' },
          { id: 'bonds', name: 'Bonds' },
          { id: 'cash', name: 'Cash' },
        ],
      };

      const result = await (rebalanceService as any).calculateCurrentAllocation(mockHoldings, mockScheme);

      // Total value = 1500 + 4000 + 5000 = 10500
      // Stocks allocation = (1500 + 4000) / 10500 = 5500 / 10500 ≈ 52.38%
      // Bonds allocation = 5000 / 10500 ≈ 47.62%
      expect(result.stocks).toBeCloseTo(52.38, 2);
      expect(result.bonds).toBeCloseTo(47.62, 2);
      expect(result.cash).toBe(0);
    });

    it('should handle holdings with undefined categories', async () => {
      const mockHoldings = [
        {
          id: 'holding-1',
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          quantity: '10',
          currency: 'USD',
          market_value: '1500',
          category: undefined, // No category
          user_id: 'user-1',
          connection_id: 'conn-1',
        },
      ];

      const mockScheme = {
        id: 'scheme-1',
        categories: [
          { id: 'stocks', name: 'Stocks' },
          { id: 'other', name: 'Other' },
        ],
      };

      const result = await (rebalanceService as any).calculateCurrentAllocation(mockHoldings, mockScheme);

      // Undefined category should default to 'other' or be handled appropriately
      expect(result.other).toBeDefined();
    });
  });

  describe('calculateAdjustments', () => {
    it('should calculate adjustments to reach target allocation', () => {
      const currentAllocation = {
        stocks: 70,
        bonds: 20,
        cash: 10,
      };

      const targetAllocation = {
        stocks: 60,
        bonds: 30,
        cash: 10,
      };

      const portfolioValue = 10000;
      const displayCurrency = 'USD';

      const result = (rebalanceService as any).calculateAdjustments(
        currentAllocation,
        targetAllocation,
        portfolioValue,
        displayCurrency
      );

      // Should sell 10% of stocks (10% of $10,000 = $1000)
      // Should buy 10% of bonds (10% of $10,000 = $1000)
      // Cash is already at target
      expect(result).toContainEqual({
        category: 'stocks',
        action: 'sell',
        amount: 1000,
      });

      expect(result).toContainEqual({
        category: 'bonds',
        action: 'buy',
        amount: 1000,
      });

      // Should not have an adjustment for cash since it's already at target
      const cashAdjustment = result.find((adj: any) => adj.category === 'cash');
      expect(cashAdjustment).toBeUndefined();
    });

    it('should handle cases where no adjustments are needed', () => {
      const currentAllocation = {
        stocks: 60,
        bonds: 30,
        cash: 10,
      };

      const targetAllocation = {
        stocks: 60,
        bonds: 30,
        cash: 10,
      };

      const portfolioValue = 10000;
      const displayCurrency = 'USD';

      const result = (rebalanceService as any).calculateAdjustments(
        currentAllocation,
        targetAllocation,
        portfolioValue,
        displayCurrency
      );

      // No adjustments should be needed
      expect(result).toHaveLength(0);
    });
  });

  describe('validateTargetAllocation', () => {
    it('should return valid when targets sum to 100%', () => {
      const targets = {
        stocks: 60,
        bonds: 30,
        cash: 10,
      };

      const result = (rebalanceService as any).validateTargetAllocation(targets);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid when targets do not sum to 100%', () => {
      const targets = {
        stocks: 60,
        bonds: 30,
        cash: 5, // Only sums to 95%
      };

      const result = (rebalanceService as any).validateTargetAllocation(targets);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('100%');
    });

    it('should return invalid when targets contain negative values', () => {
      const targets = {
        stocks: 60,
        bonds: -10, // Negative value
        cash: 60,
      };

      const result = (rebalanceService as any).validateTargetAllocation(targets);

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('negative');
    });
  });
});