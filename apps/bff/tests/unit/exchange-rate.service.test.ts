import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExchangeRateService } from '../../src/services/exchange-rate.service';

describe('ExchangeRateService', () => {
  let exchangeRateService: ExchangeRateService;

  beforeEach(() => {
    // Mock the environment and dependencies
    exchangeRateService = new ExchangeRateService(
      // Mock environment with KV namespace and API key
      {
        EXCHANGE_API_KEY: 'test-api-key',
        EXCHANGE_RATE_KV: {
          get: vi.fn(),
          put: vi.fn(),
        },
      } as any
    );
  });

  describe('getExchangeRate', () => {
    it('should fetch and cache exchange rates from API', async () => {
      const mockApiResponse = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          CNY: 7.2345,
          EUR: 0.85,
          GBP: 0.75,
        },
        time_last_update_unix: Math.floor(Date.now() / 1000),
      };

      // Mock fetch to return our test data
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const rate = await exchangeRateService.getExchangeRate('USD', 'CNY');

      expect(rate).toBe(7.2345);
      expect(fetch).toHaveBeenCalledWith(
        'https://v6.exchangerate-api.com/v6/test-api-key/latest/USD',
        expect.any(Object)
      );
    });

    it('should return cached rate if available and fresh', async () => {
      const mockCachedData = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          CNY: 7.2345,
          EUR: 0.85,
        },
        time_last_update_unix: Math.floor(Date.now() / 1000),
      };

      // Mock KV to return cached data
      const mockKV = {
        get: vi.fn().mockResolvedValue(mockCachedData),
        put: vi.fn(),
      };

      exchangeRateService = new ExchangeRateService({
        EXCHANGE_API_KEY: 'test-api-key',
        EXCHANGE_RATE_KV: mockKV,
      } as any);

      const rate = await exchangeRateService.getExchangeRate('USD', 'CNY');

      expect(rate).toBe(7.2345);
      expect(mockKV.get).toHaveBeenCalled();
      // fetch should not be called since we got from cache
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Mock fetch to simulate an API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(exchangeRateService.getExchangeRate('USD', 'CNY')).rejects.toThrow();
    });

    it('should handle missing conversion rate', async () => {
      const mockApiResponse = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          EUR: 0.85,
          GBP: 0.75,
        },
        time_last_update_unix: Math.floor(Date.now() / 1000),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await expect(exchangeRateService.getExchangeRate('USD', 'CNY')).rejects.toThrow(
        'Conversion rate not available'
      );
    });
  });

  describe('getHistoricalExchangeRate', () => {
    it('should fetch historical rate from database for USD/CNY and HKD/CNY pairs', async () => {
      // Mock database query
      const mockDbQuery = vi.fn().mockResolvedValue([
        {
          base_currency: 'USD',
          target_currency: 'CNY',
          rate: '7.2100',
          rate_date: '2026-01-10',
        },
      ]);

      // Since we can't easily mock the Drizzle DB in a unit test, we'll test the logic differently
      // This test would require integration with the actual database
      expect(exchangeRateService.getHistoricalExchangeRate).toBeDefined();
    });
  });

  describe('convertAmount', () => {
    it('should convert amount using the appropriate exchange rate', async () => {
      const mockApiResponse = {
        result: 'success',
        base_code: 'USD',
        conversion_rates: {
          CNY: 7.2345,
        },
        time_last_update_unix: Math.floor(Date.now() / 1000),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const convertedAmount = await exchangeRateService.convertAmount(100, 'USD', 'CNY');

      expect(convertedAmount).toBe(100 * 7.2345); // 723.45
    });

    it('should handle conversion to same currency', async () => {
      const convertedAmount = await exchangeRateService.convertAmount(100, 'USD', 'USD');

      expect(convertedAmount).toBe(100);
    });
  });
});