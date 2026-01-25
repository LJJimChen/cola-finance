import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createTestDb } from '../../db/testing';
import { ExchangeRateService } from '../exchange-rate-service';
import { exchangeRates } from '../../db/schema';
import { toRate8 } from '../../lib/money';

describe('ExchangeRateService', () => {
  beforeEach(() => {
    // Mock global fetch to return failure by default (simulating API down or not found)
    // to ensure tests relying on DB fallbacks pass.
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('falls back to external API if exact match is missing in DB', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);

    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        amount: 1.0,
        base: 'USD',
        date: '2024-01-02',
        rates: { CNY: 7.15 },
      }),
    });

    // Request for a date not in DB
    const rate = await service.getRateToCny('USD', '2024-01-02');
    expect(rate).toBe(7.15);

    // Verify it was persisted to DB
    const inDb = await service.getRates('2024-01-02', 'USD');
    expect(inDb).toHaveLength(1);
    expect(inDb[0].exchangeRate).toBe(7.15);
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

  it('falls back to future rate if no past rate is available (seeded data scenario)', async () => {
    const { db } = await createTestDb();
    const service = new ExchangeRateService(db);

    // Insert rate for "future" (relative to request)
    await db.insert(exchangeRates).values({
      id: 'rate-future',
      sourceCurrency: 'USD',
      targetCurrency: 'CNY',
      rate8: toRate8(7.3),
      date: '2025-01-01',
      createdAt: new Date().toISOString(),
    });

    // Request for past (2024-01-01), should get 2025-01-01 rate (7.3)
    const rate = await service.getRateToCny('USD', '2024-01-01');
    expect(rate).toBe(7.3);
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
