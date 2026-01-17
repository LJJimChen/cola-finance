/**
 * Currency conversion utilities for the asset management system
 */

// Define common currencies
export const SUPPORTED_CURRENCIES = ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'HKD'];

// Exchange rate data structure
export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rateValue: number;
  date: Date;
}

/**
 * Converts an amount from one currency to another
 * @param amount The amount to convert
 * @param fromCurrency The source currency code (e.g. 'USD')
 * @param toCurrency The target currency code (e.g. 'CNY')
 * @param exchangeRates Array of exchange rates
 * @returns The converted amount
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): number {
  // If currencies are the same, return the original amount
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }

  // Find the direct exchange rate
  const directRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === fromCurrency.toUpperCase() &&
      rate.toCurrency.toUpperCase() === toCurrency.toUpperCase()
  );

  if (directRate) {
    return amount * directRate.rateValue;
  }

  // Try to find an inverse rate (toCurrency -> fromCurrency)
  const inverseRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === toCurrency.toUpperCase() &&
      rate.toCurrency.toUpperCase() === fromCurrency.toUpperCase()
  );

  if (inverseRate) {
    // If we have the inverse rate, calculate the direct rate
    const directValue = 1 / inverseRate.rateValue;
    return amount * directValue;
  }

  // Try to find a common base conversion (e.g. via USD)
  // Find rate from fromCurrency to a common currency
  const commonBase = 'USD'; // Using USD as common base
  const toCommonRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === fromCurrency.toUpperCase() &&
      rate.toCurrency.toUpperCase() === commonBase
  );

  // Find rate from common currency to toCurrency
  const fromCommonRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === commonBase &&
      rate.toCurrency.toUpperCase() === toCurrency.toUpperCase()
  );

  if (toCommonRate && fromCommonRate) {
    const convertedViaCommon = amount * toCommonRate.rateValue;
    return convertedViaCommon * fromCommonRate.rateValue;
  }

  // If no conversion path is found, throw an error
  throw new Error(
    `No exchange rate found for conversion from ${fromCurrency} to ${toCurrency}`
  );
}

/**
 * Calculates the total value of assets in a target currency
 * @param assets Array of assets with their currencies and values
 * @param targetCurrency The target currency for conversion
 * @param exchangeRates Array of exchange rates
 * @returns The total value in the target currency
 */
export function calculateTotalValueInCurrency(
  assets: Array<{ quantity: number; currentPrice: number; currency: string }>,
  targetCurrency: string,
  exchangeRates: ExchangeRate[]
): number {
  let totalValue = 0;

  for (const asset of assets) {
    const assetValue = asset.quantity * asset.currentPrice;
    const convertedValue = convertCurrency(
      assetValue,
      asset.currency,
      targetCurrency,
      exchangeRates
    );
    totalValue += convertedValue;
  }

  return totalValue;
}

/**
 * Gets the exchange rate between two currencies
 * @param fromCurrency The source currency
 * @param toCurrency The target currency
 * @param exchangeRates Array of exchange rates
 * @returns The exchange rate value or null if not found
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRate[]
): number | null {
  // If currencies are the same, return 1
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return 1;
  }

  // Find the direct exchange rate
  const directRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === fromCurrency.toUpperCase() &&
      rate.toCurrency.toUpperCase() === toCurrency.toUpperCase()
  );

  if (directRate) {
    return directRate.rateValue;
  }

  // Try to find an inverse rate
  const inverseRate = exchangeRates.find(
    rate =>
      rate.fromCurrency.toUpperCase() === toCurrency.toUpperCase() &&
      rate.toCurrency.toUpperCase() === fromCurrency.toUpperCase()
  );

  if (inverseRate) {
    return 1 / inverseRate.rateValue;
  }

  return null;
}

/**
 * Formats a currency value for display
 * @param value The numeric value to format
 * @param currency The currency code (e.g. 'USD')
 * @param locale The locale to use for formatting (default: 'en-US')
 * @returns The formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}