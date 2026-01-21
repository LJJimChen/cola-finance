import { and, desc, eq } from 'drizzle-orm';
import type { AppDb } from '../db';
import { assets, categories, portfolios, portfolioHistories } from '../db/schema';
import { AppError } from '../lib/errors';
import { fromMoney4, roundMoney4, toMoney4 } from '../lib/money';
import { nowIsoUtc } from '../lib/time';
import { ExchangeRateService } from './exchange-rate-service';

export type PortfolioTotals = {
  totalValueCny: number;
  dailyProfitCny: number;
  currentTotalProfitCny: number;
  asOfUtc: string;
};

export class PortfolioMetricsService {
  readonly #db: AppDb;
  readonly #fx: ExchangeRateService;

  constructor(db: AppDb) {
    this.#db = db;
    this.#fx = new ExchangeRateService(db);
  }

  async recomputeAndPersist(
    userId: string,
    portfolioId: string,
    options?: { asOfUtc?: string },
  ): Promise<PortfolioTotals> {
    const portfolio = await this.#db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolio.length === 0) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'Portfolio not found' });
    }

    const asOfUtc = options?.asOfUtc ?? nowIsoUtc();
    const date = asOfUtc.slice(0, 10);

    const rows = await this.#db.select().from(assets).where(eq(assets.portfolioId, portfolioId));

    let totalValueCny = 0;
    let dailyProfitCny = 0;
    let currentTotalProfitCny = 0;

    for (const a of rows) {
      const rateToCny = await this.#fx.getRateToCny(a.currency, date);
      const value = fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
      const daily = fromMoney4(a.dailyProfit4) * rateToCny;
      const totalProfit = (fromMoney4(a.currentPrice4) - fromMoney4(a.costBasis4)) * a.quantity * rateToCny;

      totalValueCny += value;
      dailyProfitCny += daily;
      currentTotalProfitCny += totalProfit;
    }

    totalValueCny = roundMoney4(totalValueCny);
    dailyProfitCny = roundMoney4(dailyProfitCny);
    currentTotalProfitCny = roundMoney4(currentTotalProfitCny);

    await this.#db
      .update(portfolios)
      .set({
        totalValueCny4: toMoney4(totalValueCny),
        dailyProfitCny4: toMoney4(dailyProfitCny),
        currentTotalProfitCny4: toMoney4(currentTotalProfitCny),
        updatedAt: asOfUtc,
      })
      .where(eq(portfolios.id, portfolioId));

    await this.maybeSnapshot(portfolioId, { asOfUtc, totalValueCny, dailyProfitCny, currentTotalProfitCny });

    await this.refreshCategoryAllocations(userId, portfolioId, totalValueCny, date, asOfUtc);

    return { asOfUtc, totalValueCny, dailyProfitCny, currentTotalProfitCny };
  }

  async maybeSnapshot(
    portfolioId: string,
    snapshot: { asOfUtc: string; totalValueCny: number; dailyProfitCny: number; currentTotalProfitCny: number },
  ): Promise<void> {
    const last = await this.#db
      .select()
      .from(portfolioHistories)
      .where(eq(portfolioHistories.portfolioId, portfolioId))
      .orderBy(desc(portfolioHistories.timestampUtc))
      .limit(1);

    if (last.length > 0) {
      const lastTs = Date.parse(last[0].timestampUtc);
      const nowTs = Date.parse(snapshot.asOfUtc);
      const oneHourMs = 60 * 60 * 1000;
      if (Number.isFinite(lastTs) && Number.isFinite(nowTs) && nowTs - lastTs < oneHourMs) {
        return;
      }
    }

    await this.#db.insert(portfolioHistories).values({
      id: crypto.randomUUID(),
      portfolioId,
      timestampUtc: snapshot.asOfUtc,
      totalValueCny4: toMoney4(snapshot.totalValueCny),
      dailyProfitCny4: toMoney4(snapshot.dailyProfitCny),
      currentTotalProfitCny4: toMoney4(snapshot.currentTotalProfitCny),
    });
  }

  async refreshCategoryAllocations(
    userId: string,
    portfolioId: string,
    totalValueCny: number,
    date: string,
    asOfUtc: string,
  ): Promise<void> {
    const cats = await this.#db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId));

    const rows = await this.#db.select().from(assets).where(eq(assets.portfolioId, portfolioId));

    const valueByCategory = new Map<string, number>();
    for (const a of rows) {
      const rateToCny = await this.#fx.getRateToCny(a.currency, date);
      const value = fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
      const categoryId = a.categoryId ?? 'uncategorized';
      valueByCategory.set(categoryId, (valueByCategory.get(categoryId) ?? 0) + value);
    }

    for (const c of cats) {
      const value = valueByCategory.get(c.id) ?? 0;
      const allocation = totalValueCny > 0 ? Math.round((value / totalValueCny) * 10_000) : 0;
      await this.#db
        .update(categories)
        .set({ updatedAt: asOfUtc, currentAllocationBps: allocation })
        .where(eq(categories.id, c.id));
    }
  }
}
