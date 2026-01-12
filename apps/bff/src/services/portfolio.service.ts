/**
 * Portfolio service
 *
 * Intent: Aggregate portfolio data from holdings and compute summary metrics
 * Handles portfolio calculations including currency normalization
 *
 * Contract:
 * - getPortfolioSummary: Returns aggregated portfolio metrics
 * - getHoldings: Returns detailed holdings list
 */

import { Env } from '../types/env';
import { ExchangeRateService } from './exchange-rate.service';

export interface PortfolioSummary {
  totalValue: number;
  todaysReturn?: number;
  todaysReturnPercent?: number;
  lastUpdated: string;
  displayCurrency: string;
}

export interface Holding {
  id: string;
  symbol: string;
  instrument_name: string;
  instrument_name_zh?: string;
  quantity: string;
  currency: string;
  market_value: string;
  cost_basis?: string;
  unrealized_pnl?: string;
  daily_return?: string;
  total_return?: string;
  category?: string;
  last_updated_at: string;
  is_stale: boolean;
  user_id: string;
  connection_id: string;
}

export class PortfolioService {
  private exchangeRateService: ExchangeRateService;

  constructor(private env: Env) {
    this.exchangeRateService = new ExchangeRateService(env);
  }

  /**
   * Gets portfolio summary for a user
   * Optionally normalizes values to the specified currency
   */
  async getPortfolioSummary(userId: string, targetCurrency?: string): Promise<PortfolioSummary> {
    // In a real implementation, this would query the database for user's holdings
    // For now, we'll return a mock implementation
    
    // Get user's default display currency if no target currency is specified
    if (!targetCurrency) {
      // In a real implementation, we'd fetch this from the user record
      targetCurrency = 'USD'; // Default fallback
    }

    // Fetch user's holdings
    const holdings = await this.getHoldings(userId, targetCurrency);

    // Calculate total value
    let totalValue = 0;
    for (const holding of holdings) {
      // In a real implementation, the holdings would already be converted to target currency
      // For this mock, we'll assume they're already in the target currency
      totalValue += parseFloat(holding.market_value);
    }

    // Calculate today's return (simplified calculation)
    let todaysReturn = 0;
    let todaysReturnPercent = 0;
    
    for (const holding of holdings) {
      if (holding.daily_return) {
        const dailyReturnNum = parseFloat(holding.daily_return);
        const holdingValue = parseFloat(holding.market_value);
        todaysReturn += holdingValue * dailyReturnNum;
      }
    }
    
    if (totalValue > 0) {
      todaysReturnPercent = (todaysReturn / totalValue) * 100;
    }

    return {
      totalValue,
      todaysReturn,
      todaysReturnPercent,
      lastUpdated: new Date().toISOString(),
      displayCurrency: targetCurrency,
    };
  }

  /**
   * Gets holdings for a user
   * Optionally normalizes values to the specified currency
   */
  async getHoldings(userId: string, targetCurrency?: string): Promise<Holding[]> {
    // In a real implementation, this would query the database
    // For now, we'll return a mock implementation with currency conversion
    
    // If no target currency is specified, use USD as default
    if (!targetCurrency) {
      // In a real implementation, we'd fetch this from the user record
      targetCurrency = 'USD';
    }

    // Mock holdings data (in various currencies)
    const mockHoldings: Holding[] = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        instrument_name: 'Apple Inc.',
        quantity: '10',
        currency: 'USD',
        market_value: '1500',
        user_id: userId,
        connection_id: 'conn-1',
        instrument_name_zh: '苹果公司',
        cost_basis: '1200',
        daily_return: '0.025',
        total_return: '0.15',
        category: 'US Stocks',
        last_updated_at: new Date().toISOString(),
        is_stale: false,
      },
      {
        id: 'holding-2',
        symbol: '00700.HK',
        instrument_name: 'Tencent Holdings',
        quantity: '100',
        currency: 'HKD',
        market_value: '4000',
        user_id: userId,
        connection_id: 'conn-2',
        instrument_name_zh: '腾讯控股',
        cost_basis: '3500',
        daily_return: '-0.012',
        total_return: '0.08',
        category: 'HK Stocks',
        last_updated_at: new Date().toISOString(),
        is_stale: false,
      },
      {
        id: 'holding-3',
        symbol: 'NESN.SW',
        instrument_name: 'Nestlé SA',
        quantity: '50',
        currency: 'CHF',
        market_value: '5000',
        user_id: userId,
        connection_id: 'conn-3',
        instrument_name_zh: '雀巢公司',
        cost_basis: '4800',
        daily_return: '0.005',
        total_return: '0.05',
        category: 'Intl Stocks',
        last_updated_at: new Date().toISOString(),
        is_stale: true,
      },
    ];

    // If target currency is the same as user's default, return holdings as-is
    if (targetCurrency === 'USD') {
      return mockHoldings;
    }

    // Otherwise, convert all holdings to the target currency
    const convertedHoldings = [];
    for (const holding of mockHoldings) {
      if (holding.currency === targetCurrency) {
        // No conversion needed
        convertedHoldings.push(holding);
      } else {
        // Convert the holding's value to the target currency
        const originalValue = parseFloat(holding.market_value);
        const convertedValue = await this.exchangeRateService.convertAmount(
          originalValue,
          holding.currency,
          targetCurrency
        );

        // Create a new holding with converted value
        const convertedHolding = {
          ...holding,
          market_value: convertedValue.toString(),
          // Also convert cost basis if it exists
          cost_basis: holding.cost_basis 
            ? this.exchangeRateService.convertAmount(
                parseFloat(holding.cost_basis),
                holding.currency,
                targetCurrency
              ).then(val => val.toString()).toString()
            : undefined,
          // Note: In a real implementation, we'd also need to adjust other values like daily_return
          // depending on how they're calculated
        };
        
        convertedHoldings.push(convertedHolding as Holding);
      }
    }

    return convertedHoldings;
  }

  /**
   * Gets holdings grouped by currency
   */
  async getHoldingsByCurrency(userId: string): Promise<Record<string, Holding[]>> {
    const holdings = await this.getHoldings(userId);
    const grouped: Record<string, Holding[]> = {};

    for (const holding of holdings) {
      if (!grouped[holding.currency]) {
        grouped[holding.currency] = [];
      }
      grouped[holding.currency].push(holding);
    }

    return grouped;
  }

  /**
   * Gets allocation by category in the specified currency
   */
  async getCategoryAllocation(userId: string, targetCurrency?: string): Promise<Record<string, number>> {
    const holdings = await this.getHoldings(userId, targetCurrency);
    const allocation: Record<string, number> = {};

    for (const holding of holdings) {
      const category = holding.category || 'Uncategorized';
      const value = parseFloat(holding.market_value);
      
      if (!allocation[category]) {
        allocation[category] = 0;
      }
      allocation[category] += value;
    }

    return allocation;
  }
}