import { and, desc, eq, lte, asc } from 'drizzle-orm';
import type { AppDb } from '../db';
import { exchangeRates } from '../db/schema';
import { AppError } from '../lib/errors';
import { fromRate8, toRate8 } from '../lib/money';
import { randomUUID } from 'node:crypto';

export class ExchangeRateService {
  readonly #db: AppDb;

  constructor(db: AppDb) {
    this.#db = db;
  }

  /**
   * Fetch all exchange rates for a specific currency pair, sorted by date in ascending order.
   *
   * @param sourceCurrency - The source currency code (e.g., 'USD').
   * @param targetCurrency - The target currency code (default: 'CNY').
   * @returns An array of objects containing the date and the exchange rate.
   *
   * Usage Scenario:
   * Used for bulk processing, such as calculating historical performance over a date range.
   * Fetching all rates at once avoids the N+1 query problem that would occur if rates were fetched individually for each day in a loop.
   */
  async getRatesForCurrencyPair(sourceCurrency: string, targetCurrency: string = 'CNY'): Promise<{ date: Date; rate: number }[]> {
    const rawRates = await this.#db
      .select({
        date: exchangeRates.date,
        rate8: exchangeRates.rate8,
      })
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.sourceCurrency, sourceCurrency),
          eq(exchangeRates.targetCurrency, targetCurrency)
        )
      )
      .orderBy(asc(exchangeRates.date));
    
    return rawRates.map(r => ({ date: r.date, rate: fromRate8(r.rate8) }));
  }

  /**
   * Retrieve exchange rates for a specific date, optionally filtered by a base currency.
   *
   * @param date - The date for which to retrieve rates (format: YYYY-MM-DD).
   * @param baseCurrency - (Optional) The source currency code to filter by.
   * @returns An array of exchange rate records including ID, source/target currency, rate, and metadata.
   *
   * Usage Scenario:
   * Primarily used by the `/exchange-rates` API endpoint to display available rates to the user or for administrative purposes.
   */
  async getRates(date: string, baseCurrency?: string) {
    const dateObj = new Date(date);
    const query = baseCurrency
      ? and(
          eq(exchangeRates.sourceCurrency, baseCurrency),
          eq(exchangeRates.date, dateObj)
        )
      : eq(exchangeRates.date, dateObj);

    const rows = await this.#db
      .select()
      .from(exchangeRates)
      .where(query);

    return rows.map((r) => ({
      id: r.id,
      sourceCurrency: r.sourceCurrency,
      targetCurrency: r.targetCurrency,
      exchangeRate: fromRate8(r.rate8),
      date: r.date,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Get the exchange rate from a source currency to CNY for a specific date.
   * Implements a robust fallback mechanism:
   * 1. Exact match for the date.
   * 2. fetch from external API if exact match is missing in DB (will save the result to DB)
   * 3. Latest available past rate (if exact match missing).
   * 4. Absolute latest rate (if no past rate exists, e.g., only future rates seeded).
   *
   * @param sourceCurrency - The source currency code (e.g., 'USD').
   * @param date - The target date (format: YYYY-MM-DD).
   * @returns The exchange rate as a number.
   * @throws AppError - If no exchange rate can be found after all fallback attempts.
   *
   * Usage Scenario:
   * Core internal method for normalizing asset values to the system's base currency (CNY).
   * Used by `convertMoney` and other calculation services.
   */
  async getRateToCny(sourceCurrency: string, date: string): Promise<number> {
    if (sourceCurrency === 'CNY') {
      return 1;
    }

    const dateObj = new Date(date);

    let result = await this.#db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.sourceCurrency, sourceCurrency),
          eq(exchangeRates.targetCurrency, 'CNY'),
          eq(exchangeRates.date, dateObj),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      // Try to fetch from external API (Frankfurter)
      // This helps when we don't have the rate seeded in DB
      try {
        const externalRate = await this.fetchExternalRate(sourceCurrency, date);
        if (externalRate !== null) {
          return externalRate;
        }
      } catch (error) {
        console.warn('Failed to fetch/save external rate, continuing to DB fallback:', error);
      }

      // Fallback to latest available rate
      result = await this.#db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.sourceCurrency, sourceCurrency),
            eq(exchangeRates.targetCurrency, 'CNY'),
            lte(exchangeRates.date, dateObj),
          ),
        )
        .orderBy(desc(exchangeRates.date))
        .limit(1);
    }

    if (result.length === 0) {
      // Emergency fallback: If no past/current rate exists, take the absolute latest available rate
      // This handles cases where we only have future rates seeded (e.g. in dev environment)
      result = await this.#db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.sourceCurrency, sourceCurrency),
            eq(exchangeRates.targetCurrency, 'CNY'),
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

  /**
   * Convert an amount of money from one currency to another on a specific date.
   * Automatically handles cross-currency conversion via CNY (e.g., USD -> JPY becomes USD -> CNY -> JPY).
   *
   * @param amount - The amount of money to convert.
   * @param fromCurrency - The source currency code.
   * @param toCurrency - The target currency code.
   * @param date - The date to use for the exchange rate (format: YYYY-MM-DD).
   * @returns The converted amount in the target currency.
   *
   * Usage Scenario:
   * High-level API for currency conversion. Used throughout the application (e.g., Portfolio Service)
   * to display values in the user's preferred display currency.
   */
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

  private async fetchExternalRate(sourceCurrency: string, date: string): Promise<number | null> {
    try {
      // Use frankfurter.app for free rates
      // API: https://api.frankfurter.app/{date}?from={source}&to=CNY
      const url = `https://api.frankfurter.app/${date}?from=${sourceCurrency}&to=CNY`;
      const response = await fetch(url);
      
      if (!response.ok) {
        // console.warn(`External API returned ${response.status}: ${response.statusText}`);
        return null;
      }

      const data = await response.json() as { rates: { CNY: number } };
      if (data && data.rates && data.rates.CNY) {
        const rate = data.rates.CNY;
        
        // Persist to DB for future use
        // Use the REQUESTED date to ensure subsequent "exact match" queries succeed
        await this.#db.insert(exchangeRates).values({
          id: randomUUID(),
          sourceCurrency,
          targetCurrency: 'CNY',
          rate8: toRate8(rate),
          date: new Date(date),
          createdAt: new Date(),
        });

        return rate;
      }
    } catch {
      // console.warn('Error fetching external rate:', error);
      return null;
    }
    return null;
  }
}
