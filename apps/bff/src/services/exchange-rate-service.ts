import { and, desc, eq, lte } from 'drizzle-orm';
import type { AppDb } from '../db';
import { exchangeRates } from '../db/schema';
import { AppError } from '../lib/errors';
import { fromRate8 } from '../lib/money';

export class ExchangeRateService {
  readonly #db: AppDb;

  constructor(db: AppDb) {
    this.#db = db;
  }

  async getRateToCny(sourceCurrency: string, date: string): Promise<number> {
    if (sourceCurrency === 'CNY') {
      return 1;
    }

    let result = await this.#db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.sourceCurrency, sourceCurrency),
          eq(exchangeRates.targetCurrency, 'CNY'),
          eq(exchangeRates.date, date),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      // Fallback to latest available rate
      result = await this.#db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.sourceCurrency, sourceCurrency),
            eq(exchangeRates.targetCurrency, 'CNY'),
            lte(exchangeRates.date, date),
          ),
        )
        .orderBy(desc(exchangeRates.date))
        .limit(1);
    }

    if (result.length === 0) {
      throw new AppError({
        status: 422,
        code: 'MISSING_EXCHANGE_RATE',
        message: `Missing exchange rate for ${sourceCurrency}->CNY on ${date}`,
        details: { sourceCurrency, targetCurrency: 'CNY', date },
      });
    }

    return fromRate8(result[0].rate8);
  }

  async convertMoney(amount: number, fromCurrency: string, toCurrency: string, date: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    if (fromCurrency === 'CNY') {
      const toCnyRate = await this.getRateToCny(toCurrency, date);
      return amount / toCnyRate;
    }

    if (toCurrency === 'CNY') {
      const fromToCnyRate = await this.getRateToCny(fromCurrency, date);
      return amount * fromToCnyRate;
    }

    const cny = await this.convertMoney(amount, fromCurrency, 'CNY', date);
    return this.convertMoney(cny, 'CNY', toCurrency, date);
  }
}

