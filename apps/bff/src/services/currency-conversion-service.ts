import { Context } from 'hono';
import { db } from '../db';
import { exchangeRates } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface CurrencyConversionService {
  convert(fromCurrency: string, toCurrency: string, amount: number, date?: Date): Promise<number>;
  getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number>;
}

export class CurrencyConversionServiceImpl implements CurrencyConversionService {
  async convert(fromCurrency: string, toCurrency: string, amount: number, date?: Date): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // If converting from any currency to CNY, use the stored rate directly
    if (toCurrency === 'CNY') {
      const rate = await this.getExchangeRateToCNY(fromCurrency, date);
      return amount * rate;
    }

    // If converting from CNY to another currency, invert the stored rate
    if (fromCurrency === 'CNY') {
      const rate = await this.getExchangeRateToCNY(toCurrency, date);
      return amount / rate; // Invert the rate (CNY -> other currency)
    }

    // For conversions between two non-CNY currencies, convert via CNY
    const amountInCNY = await this.convert(fromCurrency, 'CNY', amount, date);
    return await this.convert('CNY', toCurrency, amountInCNY, date);
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string, date?: Date): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // If getting rate from any currency to CNY, use the stored rate directly
    if (toCurrency === 'CNY') {
      return await this.getExchangeRateToCNY(fromCurrency, date);
    }

    // If getting rate from CNY to another currency, invert the stored rate
    if (fromCurrency === 'CNY') {
      const rate = await this.getExchangeRateToCNY(toCurrency, date);
      return 1 / rate; // Invert the rate (CNY -> other currency)
    }

    // For rates between two non-CNY currencies, calculate via CNY
    const rateFromToCNY = await this.getExchangeRateToCNY(fromCurrency, date);
    const rateToToCNY = await this.getExchangeRateToCNY(toCurrency, date);
    return rateToToCNY / rateFromToCNY;
  }

  private async getExchangeRateToCNY(currency: string, date?: Date): Promise<number> {
    // If no specific date is provided, use today's date
    const queryDate = date || new Date();
    
    // Format date as YYYY-MM-DD string for querying
    const dateString = queryDate.toISOString().split('T')[0];

    // Query the database for the exchange rate
    const result = await db
      .select({ exchangeRate: exchangeRates.exchangeRate })
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.sourceCurrency, currency),
          eq(exchangeRates.targetCurrency, 'CNY'),
          eq(exchangeRates.date, dateString)
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new Error(`Exchange rate not found for ${currency} to CNY on ${dateString}`);
    }

    return result[0].exchangeRate;
  }
}

// Create a singleton instance
const currencyConversionService = new CurrencyConversionServiceImpl();

export { currencyConversionService };