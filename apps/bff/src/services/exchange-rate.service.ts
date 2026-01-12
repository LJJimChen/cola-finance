import { Env } from '../types/env';

export interface ExchangeRateRecord {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: string;
  rate_date: string;
  fetched_at: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export class ExchangeRateService {
  private readonly API_BASE_URL = 'https://v6.exchangerate-api.com/v6';
  private readonly CACHE_TTL = 86400; // 24 hours in seconds

  constructor(private env: Env) {}

  /**
   * Gets the exchange rate between two currencies
   * For USD/CNY and HKD/CNY pairs, it will try to use historical data from DB first
   * For other pairs, it will use the latest cached rate from API
   */
  async getExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    // Special handling for historical pairs (USD/CNY, HKD/CNY)
    if ((baseCurrency === 'USD' && targetCurrency === 'CNY') || 
        (baseCurrency === 'HKD' && targetCurrency === 'CNY')) {
      const historicalRate = await this.getHistoricalExchangeRate(baseCurrency, targetCurrency);
      if (historicalRate) {
        return parseFloat(historicalRate.rate);
      }
    }

    // For all other pairs, use the latest rate from API/cache
    return await this.getLatestExchangeRate(baseCurrency, targetCurrency);
  }

  /**
   * Gets historical exchange rate for specific date
   * Only applies to USD/CNY and HKD/CNY pairs
   */
  async getHistoricalExchangeRate(baseCurrency: string, targetCurrency: string, date?: string): Promise<ExchangeRateRecord | null> {
    // Only for supported historical pairs
    if (!((baseCurrency === 'USD' && targetCurrency === 'CNY') || 
          (baseCurrency === 'HKD' && targetCurrency === 'CNY'))) {
      return null;
    }

    const queryDate = date || new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

    // In a real implementation, this would query the database
    // For now, we'll return null to indicate no historical data available
    // The actual implementation would use Drizzle ORM to query the exchange_rates table
    console.log(`Querying historical rate for ${baseCurrency}/${targetCurrency} on ${queryDate}`);
    
    // Placeholder implementation - in real app, this would query the database
    return null;
  }

  /**
   * Gets the latest exchange rate from API or cache
   */
  async getLatestExchangeRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    const cacheKey = `rates:${baseCurrency}`;
    
    // Try to get from Cloudflare KV cache first
    let cachedData = await this.getCachedRates(baseCurrency);
    
    if (cachedData && this.isFresh(cachedData)) {
      const rate = cachedData.conversion_rates[targetCurrency];
      if (rate !== undefined) {
        return rate;
      }
    }

    // If not in cache or stale, fetch from API
    try {
      const freshData = await this.fetchFromApi(baseCurrency);
      await this.setCachedRates(baseCurrency, freshData);
      
      const rate = freshData.conversion_rates[targetCurrency];
      if (rate !== undefined) {
        return rate;
      } else {
        throw new Error(`Exchange rate for ${baseCurrency}/${targetCurrency} not available`);
      }
    } catch (error) {
      console.error(`Failed to fetch exchange rate for ${baseCurrency}/${targetCurrency}:`, error);
      
      // Try to return stale data if available
      if (cachedData) {
        const rate = cachedData.conversion_rates[targetCurrency];
        if (rate !== undefined) {
          console.warn(`Using stale exchange rate for ${baseCurrency}/${targetCurrency}`);
          return rate;
        }
      }
      
      throw new Error(`Exchange rate for ${baseCurrency}/${targetCurrency} not available`);
    }
  }

  /**
   * Converts an amount from one currency to another
   */
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * Checks if cached data is fresh (less than 24 hours old)
   */
  private isFresh(cachedData: any): boolean {
    if (!cachedData.time_last_update_unix) {
      return false;
    }
    
    const updateTime = new Date(cachedData.time_last_update_unix * 1000);
    const hoursSinceUpdate = (Date.now() - updateTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 24;
  }

  /**
   * Fetches exchange rates from the API
   */
  private async fetchFromApi(baseCurrency: string): Promise<any> {
    const apiKey = this.env.EXCHANGE_API_KEY;
    const url = `${this.API_BASE_URL}/${apiKey}/latest/${baseCurrency}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`API returned error: ${data['error-type'] || 'Unknown error'}`);
    }

    return data;
  }

  /**
   * Gets cached rates from Cloudflare KV
   */
  private async getCachedRates(baseCurrency: string): Promise<any | null> {
    try {
      const cacheKey = `rates:${baseCurrency}`;
      const cached = await this.env.EXCHANGE_RATE_KV.get(cacheKey, 'json');
      return cached;
    } catch (error) {
      console.error('Failed to get cached rates:', error);
      return null;
    }
  }

  /**
   * Sets cached rates in Cloudflare KV
   */
  private async setCachedRates(baseCurrency: string, data: any): Promise<void> {
    try {
      const cacheKey = `rates:${baseCurrency}`;
      await this.env.EXCHANGE_RATE_KV.put(cacheKey, JSON.stringify(data), {
        expirationTtl: this.CACHE_TTL
      });
    } catch (error) {
      console.error('Failed to set cached rates:', error);
    }
  }
}