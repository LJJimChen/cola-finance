import type { AppDb } from '../db';
import { portfolioHistories } from '../db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import type { PortfolioHistory } from '@repo/shared-types';

export interface PortfolioHistoryService {
  getLatestSnapshot(portfolioId: string): Promise<PortfolioHistory | null>;
  getSnapshots(portfolioId: string, startDate?: Date, endDate?: Date): Promise<PortfolioHistory[]>;
  createSnapshot(portfolioId: string, data: Omit<PortfolioHistory, 'id'>): Promise<PortfolioHistory>;
}

export class PortfolioHistoryServiceImpl implements PortfolioHistoryService {
  constructor(private db: AppDb) {}

  async getLatestSnapshot(portfolioId: string): Promise<PortfolioHistory | null> {
    const result = await this.db
      .select()
      .from(portfolioHistories)
      .where(eq(portfolioHistories.portfolioId, portfolioId))
      .orderBy(desc(portfolioHistories.timestamp))
      .limit(1);

    return result.length > 0 ? result[0] as unknown as PortfolioHistory : null;
  }

  async getSnapshots(portfolioId: string, startDate?: Date, endDate?: Date): Promise<PortfolioHistory[]> {
    const conditions = [eq(portfolioHistories.portfolioId, portfolioId)];

    if (startDate) {
      conditions.push(gte(portfolioHistories.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(portfolioHistories.timestamp, endDate));
    }

    const result = await this.db
      .select()
      .from(portfolioHistories)
      .where(and(...conditions))
      .orderBy(desc(portfolioHistories.timestamp));

    return result.map(item => item as unknown as PortfolioHistory);
  }

  async createSnapshot(portfolioId: string, data: Omit<PortfolioHistory, 'id'>): Promise<PortfolioHistory> {
    const [result] = await this.db
      .insert(portfolioHistories)
      .values({
        ...data,
        portfolioId,
      })
      .returning();

    return result as unknown as PortfolioHistory;
  }
}

// Create a singleton instance
// const portfolioHistoryService = new PortfolioHistoryServiceImpl();

// export { portfolioHistoryService };