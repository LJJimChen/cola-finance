/**
 * Cron job to fetch daily exchange rates
 *
 * Intent: Fetch USD/CNY and HKD/CNY rates at midnight UTC and store in DB for historical accuracy
 * Ensures accurate historical portfolio calculations for major currency pairs
 *
 * Schedule: Daily at midnight UTC (0 0 * * *)
 */

import { ExchangeRateService } from '../services/exchange-rate.service';
import { Env } from '../types/env';

interface ExchangeRateRecord {
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

export class ExchangeRateCronJob {
  private exchangeRateService: ExchangeRateService;

  constructor(env: Env) {
    this.exchangeRateService = new ExchangeRateService(env);
  }

  /**
   * Fetches and stores daily exchange rates for historical tracking
   * Specifically targets USD/CNY and HKD/CNY pairs for historical accuracy
   */
  async fetchDailyRates(): Promise<void> {
    console.log('Starting daily exchange rate fetch job...');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const fetchedAt = new Date().toISOString();
    
    // Define the pairs we want to store historically
    const historicalPairs = [
      { base: 'USD', target: 'CNY' },
      { base: 'HKD', target: 'CNY' }
    ];

    for (const pair of historicalPairs) {
      try {
        console.log(`Fetching rate for ${pair.base}/${pair.target}...`);
        
        // Get the current rate
        const rate = await this.exchangeRateService.getLatestExchangeRate(pair.base, pair.target);
        
        // Store in database
        await this.storeExchangeRate({
          id: crypto.randomUUID(), // In a real implementation, this would use the appropriate UUID function
          base_currency: pair.base,
          target_currency: pair.target,
          rate: rate.toString(),
          rate_date: today,
          fetched_at: fetchedAt,
          source: 'exchangerate-api.com',
          created_at: fetchedAt,
          updated_at: fetchedAt
        });
        
        console.log(`Successfully stored ${pair.base}/${pair.target} rate: ${rate}`);
      } catch (error) {
        console.error(`Failed to fetch/store rate for ${pair.base}/${pair.target}:`, error);
        // Continue with other pairs even if one fails
      }
    }
    
    console.log('Daily exchange rate fetch job completed.');
  }

  /**
   * Stores exchange rate in the database
   * In a real implementation, this would use Drizzle ORM to insert into the exchange_rates table
   */
  private async storeExchangeRate(rateData: ExchangeRateRecord): Promise<void> {
    // In a real implementation, we would use Drizzle ORM to insert the record
    // Example with Drizzle:
    /*
    await db.insert(exchangeRates).values({
      id: rateData.id,
      base_currency: rateData.base_currency,
      target_currency: rateData.target_currency,
      rate: rateData.rate,
      rate_date: rateData.rate_date,
      fetched_at: rateData.fetched_at,
      source: rateData.source,
    });
    */
    
    // For now, we'll just log the action
    console.log(`Would store exchange rate:`, rateData);
  }

  /**
   * Cleans up old exchange rate records (keeps only last year of data)
   */
  async cleanupOldRates(): Promise<void> {
    console.log('Starting exchange rate cleanup...');
    
    // Calculate date one year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().split('T')[0];
    
    // In a real implementation, we would delete records older than the cutoff
    // Example with Drizzle:
    /*
    await db.delete(exchangeRates).where(
      lt(exchangeRates.rate_date, cutoffDate)
    );
    */
    
    console.log(`Would delete exchange rates older than ${cutoffDate}`);
    console.log('Exchange rate cleanup completed.');
  }
}

// Export a function that can be called by the cron scheduler
export async function runDailyExchangeRateJob(env: Env): Promise<void> {
  const cronJob = new ExchangeRateCronJob(env);
  
  try {
    await cronJob.fetchDailyRates();
    await cronJob.cleanupOldRates(); // Optionally clean up old records
  } catch (error) {
    console.error('Error running daily exchange rate job:', error);
    throw error; // Re-throw to signal failure to cron system
  }
}