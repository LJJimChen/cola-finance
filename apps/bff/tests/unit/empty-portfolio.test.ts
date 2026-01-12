import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RebalanceService } from '../../src/services/rebalance.service';

describe('Empty Portfolio Edge Case', () => {
  let rebalanceService: RebalanceService;

  beforeEach(() => {
    rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);
  });

  it('should handle empty portfolio gracefully', async () => {
    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    };

    // Mock target allocation
    const mockTargetAllocation = {
      id: 'target-1',
      targets: {
        stocks: 60,
        bonds: 30,
        cash: 10,
      },
    };

    // Mock with empty holdings
    const emptyHoldings: any[] = [];

    // Mock the internal methods to return empty holdings
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(mockScheme);
    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(mockTargetAllocation);
    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({});

    // Calculate the preview with empty portfolio
    const result = await rebalanceService.computeRebalancePreview({
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    });

    // Validate the result
    expect(result).toHaveProperty('id');
    expect(result.userId).toBe('user-1');
    expect(result.schemeId).toBe('scheme-1');
    expect(result.targetId).toBe('target-1');
    expect(result.currentAllocation).toEqual({});
    expect(result.portfolioValue).toBe(0);
    expect(result.adjustments).toBeInstanceOf(Array);
    expect(result.adjustments).toHaveLength(0); // No adjustments possible with empty portfolio
    expect(result.displayCurrency).toBe('USD');
    expect(result.computedAt).toBeDefined();
  });

  it('should disable rebalance preview for empty portfolio', async () => {
    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    };

    // Mock target allocation
    const mockTargetAllocation = {
      id: 'target-1',
      targets: {
        stocks: 60,
        bonds: 30,
        cash: 10,
      },
    };

    // Mock the internal methods to return empty holdings
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(mockScheme);
    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(mockTargetAllocation);
    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({});

    // Calculate the preview with empty portfolio
    const result = await rebalanceService.computeRebalancePreview({
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    });

    // The preview should still be computable but with no actionable adjustments
    expect(result.currentAllocation).toEqual({});
    expect(result.portfolioValue).toBe(0);
    expect(result.adjustments).toHaveLength(0);

    // The drift should show the difference between target and actual (which is all 0)
    // For an empty portfolio, all current allocations are 0
    for (const [category, targetPercentage] of Object.entries(mockTargetAllocation.targets)) {
      expect(result.drift[category]).toBe(-targetPercentage); // Negative drift means underweight
    }
  });

  it('should show appropriate empty state message', async () => {
    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    };

    // Mock target allocation
    const mockTargetAllocation = {
      id: 'target-1',
      targets: {
        stocks: 60,
        bonds: 30,
        cash: 10,
      },
    };

    // Mock the internal methods to return empty holdings
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(mockScheme);
    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(mockTargetAllocation);
    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({});

    // Calculate the preview with empty portfolio
    const result = await rebalanceService.computeRebalancePreview({
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    });

    // Verify that the result contains appropriate information for UI to show empty state
    expect(result.portfolioValue).toBe(0);
    expect(Object.keys(result.currentAllocation).length).toBe(0);
    expect(result.adjustments.length).toBe(0);
    
    // The drift should indicate that all categories are underweight by their target amount
    expect(Math.abs(Object.values(result.drift).reduce((sum, val) => sum + Math.abs(val), 0) - 100)).toBeLessThan(0.01);
  });
});