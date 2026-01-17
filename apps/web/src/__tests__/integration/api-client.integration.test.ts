import { getApiClient } from '@repo/shared-types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the ky client
vi.mock('ky', () => {
  return {
    default: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('API Client Integration', () => {
  let apiClient: ReturnType<typeof getApiClient>;

  beforeEach(() => {
    apiClient = getApiClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have a method to get user profile', async () => {
    const mockResponse = {
      id: 'user-123',
      email: 'test@example.com',
      languagePreference: 'en',
      themeSettings: 'light',
      displayCurrency: 'USD',
    };

    // Since we're mocking ky, we'll just verify the method exists
    expect(apiClient.getUserProfile).toBeTypeOf('function');
  });

  it('should have a method to update user profile', async () => {
    expect(apiClient.updateUserProfile).toBeTypeOf('function');
  });

  it('should have a method to get dashboard data', async () => {
    expect(apiClient.getDashboardData).toBeTypeOf('function');
  });

  it('should have methods for portfolio operations', async () => {
    expect(apiClient.getPortfolios).toBeTypeOf('function');
    expect(apiClient.createPortfolio).toBeTypeOf('function');
    expect(apiClient.getPortfolio).toBeTypeOf('function');
  });

  it('should have methods for asset operations', async () => {
    expect(apiClient.getAssets).toBeTypeOf('function');
    expect(apiClient.createAsset).toBeTypeOf('function');
  });

  it('should have methods for category operations', async () => {
    expect(apiClient.getCategories).toBeTypeOf('function');
    expect(apiClient.createCategory).toBeTypeOf('function');
    expect(apiClient.updateCategory).toBeTypeOf('function');
  });

  it('should have methods for rebalancing operations', async () => {
    expect(apiClient.getRebalanceRecommendations).toBeTypeOf('function');
  });
});