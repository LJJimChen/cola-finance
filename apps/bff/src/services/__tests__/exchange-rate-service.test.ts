import { describe, expect, it } from 'vitest';
import { createTestDb } from '../../db/testing';
import { ExchangeRateService } from '../exchange-rate-service';
import { exchangeRates } from '../../db/schema';
import { toRate8 } from '../../lib/money';

describe('ExchangeRateService', () => {
  it('retrieves exact match rate', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);

    await db.insert(exchangeRates).values({
      id: 'rate-1',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.2),
      date: '2024-01-01',
      createdAt: new Date().toISOString(),
    });

    const rate = await service.getRateToCny('USD', '2024-01-01');
    expect(rate).toBe(7.2);
  });

  it('falls back to latest available rate if exact match is missing', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);

    // Insert rate for yesterday
    await db.insert(exchangeRates).values({
      id: 'rate-old',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.1),
      date: '2024-01-01',
      createdAt: new Date().toISOString(),
    });

    // Insert rate for day before yesterday
    await db.insert(exchangeRates).values({
      id: 'rate-older',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.0),
      date: '2023-12-31',
      createdAt: new Date().toISOString(),
    });

    // Request for today (2024-01-02), should get 2024-01-01 rate (7.1)
    const rate = await service.getRateToCny('USD', '2024-01-02');
    expect(rate).toBe(7.1);
  });

  it('throws if no rate is found', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);

    await expect(service.getRateToCny('USD', '2024-01-01'))
      .rejects.toThrow('Missing exchange rate');
  });

  it('returns 1 for CNY to CNY', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);
    expect(await service.getRateToCny('CNY', '2024-01-01')).toBe(1);
  });
});
