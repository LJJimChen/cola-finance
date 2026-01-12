import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RebalanceService } from '../../src/services/rebalance.service';

describe('Rebalance Target Validation Edge Cases', () => {
  let rebalanceService: RebalanceService;

  beforeEach(() => {
    rebalanceService = new RebalanceService({
      DB: {} as any,
      JWT_SECRET: 'test-secret',
      EXCHANGE_API_KEY: 'test-key',
    } as any);
  });

  it('should block submission when targets do not sum to exactly 100%', async () => {
    // Mock scheme
    const mockScheme = {
      id: 'scheme-1',
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'cash', name: 'Cash' },
      ],
    };

    // Test case 1: Targets sum to less than 100%
    const targetsBelow100 = {
      stocks: 50,  // 50%
      bonds: 30,   // 30%
      cash: 10,    // 10% - Total: 90%
    };

    const resultBelow = (rebalanceService as any).validateTargetAllocation(targetsBelow100);
    expect(resultBelow.isValid).toBe(false);
    expect(resultBelow.message).toContain('100%');
    expect(resultBelow.message).toContain('90%'); // The actual sum

    // Test case 2: Targets sum to more than 100%
    const targetsAbove100 = {
      stocks: 60,  // 60%
      bonds: 30,   // 30%
      cash: 20,    // 20% - Total: 110%
    };

    const resultAbove = (rebalanceService as any).validateTargetAllocation(targetsAbove100);
    expect(resultAbove.isValid).toBe(false);
    expect(resultAbove.message).toContain('100%');
    expect(resultAbove.message).toContain('110%'); // The actual sum

    // Test case 3: Targets sum to exactly 100%
    const targetsExactly100 = {
      stocks: 60,  // 60%
      bonds: 30,   // 30%
      cash: 10,    // 10% - Total: 100%
    };

    const resultExact = (rebalanceService as any).validateTargetAllocation(targetsExactly100);
    expect(resultExact.isValid).toBe(true);
    expect(resultExact.message).toBeUndefined();
  });

  it('should block submission when targets contain negative values', async () => {
    // Test case with negative value
    const targetsWithNegative = {
      stocks: 60,
      bonds: -10,  // Negative value
      cash: 60,    // Would sum to 110% anyway, but test negative first
    };

    const result = (rebalanceService as any).validateTargetAllocation(targetsWithNegative);
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('cannot be negative');
    expect(result.message).toContain('-10');
  });

  it('should handle floating point precision in validation', async () => {
    // Test case with floating point values that sum to 100% when accounting for precision
    const targetsWithFloats = {
      stocks: 33.33,
      bonds: 33.33,
      cash: 33.34,  // Total is 100.00 (due to rounding)
    };

    const result = (rebalanceService as any).validateTargetAllocation(targetsWithFloats);
    expect(result.isValid).toBe(true);
  });

  it('should handle floating point precision that is slightly off 100%', async () => {
    // Test case with floating point values that sum close to but not exactly 100%
    const targetsWithFloats = {
      stocks: 33.333,
      bonds: 33.333,
      cash: 33.333,  // Total is 99.999, which should be considered valid due to floating point precision
    };

    const result = (rebalanceService as any).validateTargetAllocation(targetsWithFloats);
    // This should be valid as it's within tolerance for floating point precision
    expect(result.isValid).toBe(true);
  });

  it('should work with a single category at 100%', async () => {
    const singleCategory = {
      stocks: 100,
    };

    const result = (rebalanceService as any).validateTargetAllocation(singleCategory);
    expect(result.isValid).toBe(true);
  });

  it('should work with many categories that sum to 100%', async () => {
    const manyCategories = {
      stocks: 25,
      bonds: 25,
      cash: 20,
      funds: 15,
      crypto: 10,
      other: 5,
    };

    const result = (rebalanceService as any).validateTargetAllocation(manyCategories);
    expect(result.isValid).toBe(true);
  });
});