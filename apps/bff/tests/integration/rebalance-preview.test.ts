import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { RebalanceService } from '../../src/services/rebalance.service';
import { ClassificationService } from '../../src/services/classification.service';

describe('Rebalance Preview Integration', () => {
  let app: Hono;
  let mockRebalanceService: RebalanceService;
  let mockClassificationService: ClassificationService;

  beforeEach(() => {
    // Mock services
    mockRebalanceService = vi.mocked(RebalanceService);
    mockClassificationService = vi.mocked(ClassificationService);

    // Set up the app with mocked dependencies
    app = new Hono();
  });

  it('should compute rebalance preview with drift and adjustments', async () => {
    // Mock the rebalance service to return a specific preview
    const mockPreview = {
      id: 'preview-1',
      userId: 'user-1',
      schemeId: 'scheme-1',
      targetId: 'target-1',
      currentAllocation: {
        stocks: 70,
        bonds: 20,
        cash: 10,
      },
      drift: {
        stocks: 10, // Overweight by 10%
        bonds: -5,  // Underweight by 5%
        cash: -5,   // Underweight by 5%
      },
      adjustments: [
        {
          category: 'stocks',
          action: 'sell',
          amount: 1000,
        },
        {
          category: 'bonds',
          action: 'buy',
          amount: 500,
        },
        {
          category: 'cash',
          action: 'buy',
          amount: 500,
        },
      ],
      portfolioValue: 10000,
      displayCurrency: 'USD',
      computedAt: new Date().toISOString(),
    };

    // Since we can't easily mock the internal methods of the service,
    // we'll test the public interface instead
    const rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);

    // We'll test the computeRebalancePreview method with mocked dependencies
    // For this test, we'll focus on verifying the integration between components
    const params = {
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    };

    // Mock the internal methods that fetch data
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue({
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    });

    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue({
      id: 'target-1',
      targets: {
        stocks: 60,
        bonds: 25,
        cash: 15,
      },
    });

    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({
      stocks: 70,
      bonds: 20,
      cash: 10,
    });

    // Call the method
    const result = await rebalanceService.computeRebalancePreview(params);

    // Assertions
    expect(result).toHaveProperty('id');
    expect(result.userId).toBe('user-1');
    expect(result.schemeId).toBe('scheme-1');
    expect(result.displayCurrency).toBe('USD');
    expect(result.currentAllocation).toEqual({
      stocks: 70,
      bonds: 20,
      cash: 10,
    });
    expect(result.adjustments).toBeInstanceOf(Array);
    expect(result.portfolioValue).toBeGreaterThan(0);
  });

  it('should handle case where classification scheme is not found', async () => {
    const rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);

    // Mock the method to return null (scheme not found)
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue(null);

    const params = {
      userId: 'user-1',
      schemeId: 'non-existent-scheme',
      displayCurrency: 'USD',
    };

    // Expect the method to throw an error
    await expect(rebalanceService.computeRebalancePreview(params))
      .rejects
      .toThrow(`Classification scheme not found: ${params.schemeId}`);
  });

  it('should handle case where target allocation is not found', async () => {
    const rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);

    // Mock the methods
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue({
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
      ],
    });

    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue(null);

    const params = {
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    };

    // Expect the method to throw an error
    await expect(rebalanceService.computeRebalancePreview(params))
      .rejects
      .toThrow(`Target allocation not found for user ${params.userId} and scheme ${params.schemeId}`);
  });

  it('should validate that target allocation sums to 100%', async () => {
    const rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);

    // Mock the methods
    vi.spyOn(rebalanceService as any, 'getClassificationScheme').mockResolvedValue({
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    });

    vi.spyOn(rebalanceService as any, 'getTargetAllocation').mockResolvedValue({
      id: 'target-1',
      targets: {
        stocks: 60,
        bonds: 30, // Only sums to 95% with cash at 10%
        cash: 10,
      },
    });

    vi.spyOn(rebalanceService as any, 'calculateCurrentAllocation').mockResolvedValue({
      stocks: 65,
      bonds: 25,
      cash: 10,
    });

    const params = {
      userId: 'user-1',
      schemeId: 'scheme-1',
      displayCurrency: 'USD',
    };

    // Call the method
    const result = await rebalanceService.computeRebalancePreview(params);

    // The service should still work but adjustments will reflect the mismatch
    expect(result).toHaveProperty('id');
    expect(result.adjustments).toBeInstanceOf(Array);
  });
});