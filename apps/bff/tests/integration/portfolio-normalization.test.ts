import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { ExchangeRateService } from '../../src/services/exchange-rate.service';
import { PortfolioService } from '../../src/services/portfolio.service';
import { exchangeRateService } from '../../src/services/exchange-rate.service';
import { portfolioService } from '../../src/services/portfolio.service';

// Mock the environment
vi.mock('../../src/services/exchange-rate.service', () => ({
  ExchangeRateService: vi.fn(),
}));

vi.mock('../../src/services/portfolio.service', () => ({
  PortfolioService: vi.fn(),
}));

describe('Portfolio Normalization Integration', () => {
  let app: Hono;
  let mockExchangeRateService: any;
  let mockPortfolioService: any;

  beforeEach(() => {
    // Create mocks for services
    mockExchangeRateService = {
      convertAmount: vi.fn().mockResolvedValue(723.45),
      getExchangeRate: vi.fn().mockResolvedValue(7.2345),
    };

    mockPortfolioService = {
      getPortfolioSummary: vi.fn().mockResolvedValue({
        totalValue: 10000,
        holdingsCount: 5,
        currencies: ['USD', 'HKD', 'EUR'],
      }),
      getHoldings: vi.fn().mockResolvedValue([
        {
          id: 'holding-1',
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          quantity: '10',
          currency: 'USD',
          market_value: '1500',
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
          user_id: 'user-1',
          connection_id: 'conn-1',
        },
      ]),
    };

    // Override the service constructors with mocks
    (ExchangeRateService as any).mockImplementation(() => mockExchangeRateService);
    (PortfolioService as any).mockImplementation(() => mockPortfolioService);

    // Import the routes after mocking
    const { app: importedApp } = require('../../src/index');
    app = importedApp;
  });

  it('should normalize portfolio values to requested currency', async () => {
    // Mock the request to the portfolio endpoint with currency parameter
    const response = await app.request('/portfolio?currency=CNY', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token',
      },
    });

    expect(response.status).toBe(200);
    const result = await response.json();

    // Verify that the exchange rate service was called to convert values
    expect(mockExchangeRateService.convertAmount).toHaveBeenCalledWith(10000, 'USD', 'CNY');
    
    // Verify that the response contains normalized values
    expect(result).toHaveProperty('totalValue');
    expect(result.totalValue).toBeGreaterThan(0); // Should be the converted value
    expect(result).toHaveProperty('displayCurrency', 'CNY');
  });

  it('should normalize individual holdings to requested currency', async () => {
    const response = await app.request('/portfolio/holdings?currency=CNY', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token',
      },
    });

    expect(response.status).toBe(200);
    const result = await response.json();

    // Verify that each holding has been converted to the requested currency
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const holding = result[0];
      expect(holding).toHaveProperty('market_value_converted');
      expect(holding).toHaveProperty('original_currency');
    }

    // Verify that the exchange rate service was called for each holding
    expect(mockExchangeRateService.convertAmount).toHaveBeenCalled();
  });

  it('should return original values when no currency parameter is provided', async () => {
    const response = await app.request('/portfolio', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token',
      },
    });

    expect(response.status).toBe(200);
    const result = await response.json();

    // Should return values in user's default currency
    expect(result).toHaveProperty('displayCurrency');
  });

  it('should handle invalid currency codes gracefully', async () => {
    const response = await app.request('/portfolio?currency=INVALID', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token',
      },
    });

    // Should either return an error or default to user's currency
    expect(response.status).toBeOneOf([400, 200]);
  });
});