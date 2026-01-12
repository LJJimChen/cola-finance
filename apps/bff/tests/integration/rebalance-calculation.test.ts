import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RebalanceService } from '../../src/services/rebalance.service';

describe('Rebalance Calculation Accuracy', () => {
  let rebalanceService: RebalanceService;

  beforeEach(() => {
    rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);
  });

  it('should accurately calculate drift between current and target allocation', async () => {
    // Mock holdings data
    const mockHoldings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        instrument_name: 'Apple Inc.',
        quantity: '10',
        currency: 'USD',
        market_value: '6000', // 60% of portfolio
        category: 'stocks',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-2',
        symbol: 'TLT',
        instrument_name: 'Treasury Bond',
        quantity: '20',
        currency: 'USD',
        market_value: '3000', // 30% of portfolio
        category: 'bonds',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-3',
        symbol: 'USD',
        instrument_name: 'Cash',
        quantity: '1',
        currency: 'USD',
        market_value: '1000', // 10% of portfolio
        category: 'cash',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
    ];

    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
        { id: 'funds', name: 'Funds' },
      ],
    };

    // Mock target allocation
    const mockTargetAllocation = {
      id: 'target-1',
      targets: {
        stocks: 50,  // Want 50% stocks, have 60% -> -10% drift
        bonds: 35,   // Want 35% bonds, have 30% -> +5% drift
        cash: 15,    // Want 15% cash, have 10% -> +5% drift
      },
    };

    // Mock the internal methods to return our test data
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(mockScheme);
    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(mockTargetAllocation);
    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({
      stocks: 60, // Currently 60% stocks
      bonds: 30,  // Currently 30% bonds
      cash: 10,   // Currently 10% cash
    });

    // Calculate the preview
    const result = await rebalanceService.computeRebalancePreview({
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    });

    // Validate the drift calculation
    // Expected drift = current - target
    // Stocks: 60 - 50 = +10 (overweight)
    // Bonds: 30 - 35 = -5 (underweight)
    // Cash: 10 - 15 = -5 (underweight)
    expect(result.drift.stocks).toBeCloseTo(10, 2);
    expect(result.drift.bonds).toBeCloseTo(-5, 2);
    expect(result.drift.cash).toBeCloseTo(-5, 2);

    // Validate adjustments
    // Should sell 10% of stocks (10% of $10,000 = $1000)
    // Should buy 5% of bonds (5% of $10,000 = $500)
    // Should buy 5% of cash (5% of $10,000 = $500)
    const stockAdjustment = result.adjustments.find(adj => adj.category === 'stocks');
    expect(stockAdjustment).toBeDefined();
    expect(stockAdjustment?.action).toBe('sell');
    expect(stockAdjustment?.amount).toBeCloseTo(1000, 2);

    const bondAdjustment = result.adjustments.find(adj => adj.category === 'bonds');
    expect(bondAdjustment).toBeDefined();
    expect(bondAdjustment?.action).toBe('buy');
    expect(bondAdjustment?.amount).toBeCloseTo(500, 2);

    const cashAdjustment = result.adjustments.find(adj => adj.category === 'cash');
    expect(cashAdjustment).toBeDefined();
    expect(cashAdjustment?.action).toBe('buy');
    expect(cashAdjustment?.amount).toBeCloseTo(500, 2);
  });

  it('should handle cases where targets do not sum to 100%', async () => {
    // Mock holdings data
    const mockHoldings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        instrument_name: 'Apple Inc.',
        quantity: '10',
        currency: 'USD',
        market_value: '5000', // 50% of portfolio
        category: 'stocks',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-2',
        symbol: 'TLT',
        instrument_name: 'Treasury Bond',
        quantity: '20',
        currency: 'USD',
        market_value: '3000', // 30% of portfolio
        category: 'bonds',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-3',
        symbol: 'USD',
        instrument_name: 'Cash',
        quantity: '1',
        currency: 'USD',
        market_value: '2000', // 20% of portfolio
        category: 'cash',
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
    ];

    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    };

    // Mock target allocation that sums to 95% (not 100%)
    const mockTargetAllocation = {
      id: 'target-1',
      targets: {
        stocks: 55,  // 55%
        bonds: 30,   // 30%
        cash: 10,    // 10% - only sums to 95%
      },
    };

    // Mock the internal methods to return our test data
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(mockScheme);
    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(mockTargetAllocation);
    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({
      stocks: 50, // Currently 50% stocks
      bonds: 30,  // Currently 30% bonds
      cash: 20,   // Currently 20% cash
    });

    // Calculate the preview
    const result = await rebalanceService.computeRebalancePreview({
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    });

    // Validate the drift calculation
    // Expected drift = current - target
    // Stocks: 50 - 55 = -5 (underweight)
    // Bonds: 30 - 30 = 0 (on target)
    // Cash: 20 - 10 = +10 (overweight)
    expect(result.drift.stocks).toBeCloseTo(-5, 2);
    expect(result.drift.bonds).toBeCloseTo(0, 2);
    expect(result.drift.cash).toBeCloseTo(10, 2);
  });

  it('should validate target allocation sums to 100%', () => {
    const validator = (rebalanceService as any).validateTargetAllocation;
    
    // Valid allocation (sums to 100%)
    const validTargets = {
      stocks: 60,
      bonds: 30,
      cash: 10,
    };
    
    const validResult = validator(validTargets);
    expect(validResult.isValid).toBe(true);
    
    // Invalid allocation (doesn't sum to 100%)
    const invalidTargets = {
      stocks: 60,
      bonds: 30,
      cash: 5, // Only sums to 95%
    };
    
    const invalidResult = validator(invalidTargets);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.message).toContain('100%');
    
    // Invalid allocation with negative value
    const negativeTargets = {
      stocks: 60,
      bonds: -10, // Negative value
      cash: 60,
    };
    
    const negativeResult = validator(negativeTargets);
    expect(negativeResult.isValid).toBe(false);
    expect(negativeResult.message).toContain('negative');
  });
});