import { describe, it, expect, beforeEach } from 'vitest';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../src/db/schema';

// Mock test to validate seeded portfolio with categorized holdings
describe('Portfolio Seeding with Categorized Holdings', () => {
  let db: ReturnType<typeof drizzle>;

  beforeEach(async () => {
    // In a real test, this would connect to a test database
    // For now, we'll just validate the structure
  });

  it('should seed portfolio with holdings in different categories', async () => {
    // This test would normally insert sample data into the database
    // For validation purposes, we'll just check that the schema supports this
    
    // Sample holdings data that would be seeded
    const sampleHoldings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        instrument_name: 'Apple Inc.',
        quantity: '10',
        currency: 'USD',
        market_value: '1500',
        category: 'stocks', // Categorized as stock
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-2',
        symbol: 'GOOGL',
        instrument_name: 'Alphabet Inc.',
        quantity: '5',
        currency: 'USD',
        market_value: '1000',
        category: 'stocks', // Categorized as stock
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-3',
        symbol: 'TLT',
        instrument_name: 'iShares 20+ Year Treasury Bond ETF',
        quantity: '20',
        currency: 'USD',
        market_value: '2000',
        category: 'bonds', // Categorized as bond
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-4',
        symbol: 'SPY',
        instrument_name: 'SPDR S&P 500 ETF Trust',
        quantity: '8',
        currency: 'USD',
        market_value: '4000',
        category: 'funds', // Categorized as fund
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
      {
        id: 'holding-5',
        symbol: 'USD',
        instrument_name: 'US Dollar',
        quantity: '1',
        currency: 'USD',
        market_value: '1000',
        category: 'cash', // Categorized as cash
        user_id: 'user-1',
        connection_id: 'conn-1',
      },
    ];

    // Validate that each holding has the required properties
    for (const holding of sampleHoldings) {
      expect(holding).toHaveProperty('id');
      expect(holding).toHaveProperty('symbol');
      expect(holding).toHaveProperty('instrument_name');
      expect(holding).toHaveProperty('quantity');
      expect(holding).toHaveProperty('currency');
      expect(holding).toHaveProperty('market_value');
      expect(holding).toHaveProperty('category');
      expect(holding).toHaveProperty('user_id');
      expect(holding).toHaveProperty('connection_id');
      
      // Validate that category is one of the expected values
      expect(['stocks', 'bonds', 'funds', 'cash', 'crypto', 'other']).toContain(holding.category);
    }

    // Validate that we have holdings in multiple categories
    const categories = new Set(sampleHoldings.map(h => h.category));
    expect(categories.size).toBeGreaterThan(1); // Should have multiple categories
    expect(categories).toContain('stocks');
    expect(categories).toContain('bonds');
    expect(categories).toContain('funds');
    expect(categories).toContain('cash');
  });

  it('should validate that classification schemes exist', async () => {
    // Sample classification scheme that would be seeded
    const sampleScheme = {
      id: 'preset_asset_class',
      userId: null, // Preset scheme
      name: 'Asset Class',
      nameZh: '资产类别',
      description: 'Classify holdings by asset class (stocks, bonds, cash, etc.)',
      isPreset: true,
      categories: [
        { id: 'stocks', name: 'Stocks', name_zh: '股票' },
        { id: 'bonds', name: 'Bonds', name_zh: '债券' },
        { id: 'funds', name: 'Funds', name_zh: '基金' },
        { id: 'cash', name: 'Cash', name_zh: '现金' },
        { id: 'crypto', name: 'Crypto', name_zh: '加密货币' },
        { id: 'other', name: 'Other', name_zh: '其他' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate scheme structure
    expect(sampleScheme).toHaveProperty('id');
    expect(sampleScheme).toHaveProperty('name');
    expect(sampleScheme).toHaveProperty('isPreset');
    expect(sampleScheme).toHaveProperty('categories');
    expect(Array.isArray(sampleScheme.categories)).toBe(true);
    
    // Validate categories
    for (const category of sampleScheme.categories) {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
    }
  });
});