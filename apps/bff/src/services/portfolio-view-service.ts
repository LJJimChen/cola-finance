import { and, asc, eq } from 'drizzle-orm';
import type {
  AllocationData,
  Asset,
  DashboardData,
  RebalanceRecommendations,
} from '@repo/shared-types';
import type { AppDb } from '../db';
import { assets, categories, portfolios } from '../db/schema';
import { AppError } from '../lib/errors';
import { fromMoney4, roundMoney4 } from '../lib/money';
import { ExchangeRateService } from './exchange-rate-service';
import { PortfolioMetricsService } from './portfolio-metrics-service';

function assetRowToApi(row: typeof assets.$inferSelect): Asset {
  return {
    id: row.id,
    // userId: row.userId,
    portfolioId: row.portfolioId,
    categoryId: row.categoryId ?? undefined,
    symbol: row.symbol,
    name: row.name,
    quantity: row.quantity,
    costBasis: fromMoney4(row.costBasis4),
    dailyProfit: fromMoney4(row.dailyProfit4),
    currentPrice: fromMoney4(row.currentPrice4),
    currency: row.currency,
    brokerSource: row.brokerSource,
    brokerAccount: row.brokerAccount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PortfolioViewService {
  readonly #db: AppDb;
  readonly #fx: ExchangeRateService;
  readonly #metrics: PortfolioMetricsService;

  constructor(db: AppDb) {
    this.#db = db;
    this.#fx = new ExchangeRateService(db);
    this.#metrics = new PortfolioMetricsService(db);
  }

  async getDashboard(userId: string, portfolioId: string, displayCurrency: string): Promise<DashboardData> {
    const totals = await this.#metrics.recomputeAndPersist(userId, portfolioId);
    const asOfDate = totals.asOfUtc.slice(0, 10);

    const portfolio = await this.#db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolio.length === 0) {
      throw new AppError({ status: 404, code: 'NOT_FOUND', message: 'Portfolio not found' });
    }

    const totalValue = roundMoney4(await this.#fx.convertMoney(totals.totalValueCny, 'CNY', displayCurrency, asOfDate));
    const dailyProfit = roundMoney4(await this.#fx.convertMoney(totals.dailyProfitCny, 'CNY', displayCurrency, asOfDate));
    const totalProfit = roundMoney4(
      await this.#fx.convertMoney(totals.currentTotalProfitCny, 'CNY', displayCurrency, asOfDate),
    );

    const annualReturn =
      totals.totalValueCny > 0 ? roundMoney4((totals.currentTotalProfitCny / totals.totalValueCny) * 100) : 0;

    const cats = await this.#db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId))
      .orderBy(asc(categories.name));

    const assetRows = await this.#db.select().from(assets).where(eq(assets.portfolioId, portfolioId));

    const valueByCategoryId = new Map<string, number>();
    for (const a of assetRows) {
      const rateToCny = await this.#fx.getRateToCny(a.currency, asOfDate);
      const value = fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
      const categoryId = a.categoryId ?? 'uncategorized';
      valueByCategoryId.set(categoryId, (valueByCategoryId.get(categoryId) ?? 0) + value);
    }

    const allocationByCategory = [];
    for (const c of cats) {
      const valueCny = valueByCategoryId.get(c.id) ?? 0;
      const percentage = totals.totalValueCny > 0 ? (valueCny / totals.totalValueCny) * 100 : 0;
      const value = roundMoney4(await this.#fx.convertMoney(valueCny, 'CNY', displayCurrency, asOfDate));
      allocationByCategory.push({ categoryName: c.name, percentage: roundMoney4(percentage), value });
    }

    const topPerformingAssets = [...assetRows]
      .sort((a, b) => b.dailyProfit4 - a.dailyProfit4)
      .slice(0, 5)
      .map(assetRowToApi);

    return {
      totalValue,
      dailyProfit,
      annualReturn,
      totalProfit,
      currency: displayCurrency,
      lastUpdated: totals.asOfUtc,
      allocationByCategory,
      topPerformingAssets,
    };
  }

  async getAllocation(userId: string, portfolioId: string, displayCurrency: string): Promise<AllocationData> {
    const totals = await this.#metrics.recomputeAndPersist(userId, portfolioId);
    const asOfDate = totals.asOfUtc.slice(0, 10);

    const cats = await this.#db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId))
      .orderBy(asc(categories.name));

    const assetRows = await this.#db.select().from(assets).where(eq(assets.portfolioId, portfolioId));

    const totalValueDisplay = roundMoney4(
      await this.#fx.convertMoney(totals.totalValueCny, 'CNY', displayCurrency, asOfDate),
    );

    const assetsByCategory = new Map<string, typeof assetRows>();
    for (const a of assetRows) {
      const categoryId = a.categoryId ?? 'uncategorized';
      const list = assetsByCategory.get(categoryId) ?? [];
      list.push(a);
      assetsByCategory.set(categoryId, list);
    }

    const categoriesData: AllocationData['categories'] = [];
    for (const c of cats) {
      const group = assetsByCategory.get(c.id) ?? [];
      const computed = await this.computeCategoryGroup(group, asOfDate, displayCurrency, totals.totalValueCny);
      categoriesData.push({
        id: c.id,
        name: c.name,
        targetAllocation: c.targetAllocationBps / 100,
        currentAllocation: computed.currentAllocation,
        value: computed.value,
        profitAmount: computed.profitAmount,
        yield: computed.yield,
        assets: computed.assets,
      });
    }

    return { totalValue: totalValueDisplay, currency: displayCurrency, categories: categoriesData };
  }

  async getRebalance(userId: string, portfolioId: string): Promise<RebalanceRecommendations> {
    const totals = await this.#metrics.recomputeAndPersist(userId, portfolioId);
    const asOfDate = totals.asOfUtc.slice(0, 10);

    const cats = await this.#db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId))
      .orderBy(asc(categories.name));

    const assetRows = await this.#db.select().from(assets).where(eq(assets.portfolioId, portfolioId));

    const valueByCategoryId = new Map<string, number>();
    for (const a of assetRows) {
      const rateToCny = await this.#fx.getRateToCny(a.currency, asOfDate);
      const value = fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
      const categoryId = a.categoryId ?? 'uncategorized';
      valueByCategoryId.set(categoryId, (valueByCategoryId.get(categoryId) ?? 0) + value);
    }

    const recommendations = cats.map((c) => {
      const currentValueCny = valueByCategoryId.get(c.id) ?? 0;
      const currentAllocation = totals.totalValueCny > 0 ? (currentValueCny / totals.totalValueCny) * 100 : 0;
      const targetAllocation = c.targetAllocationBps / 100;
      const deviation = roundMoney4(currentAllocation - targetAllocation);

      const targetValueCny = (targetAllocation / 100) * totals.totalValueCny;
      const deltaCny = roundMoney4(targetValueCny - currentValueCny);

      const recommendation =
        Math.abs(deviation) < 1
          ? 'Within tolerance'
          : deviation > 0
            ? 'Overweight: consider trimming'
            : 'Underweight: consider adding';

      const suggestedActions =
        Math.abs(deviation) < 1
          ? []
          : deviation > 0
            ? [`Sell approximately ${Math.abs(deltaCny).toFixed(4)} CNY worth from this category`]
            : [`Buy approximately ${Math.abs(deltaCny).toFixed(4)} CNY worth into this category`];

      return {
        categoryId: c.id,
        categoryName: c.name,
        currentAllocation: roundMoney4(currentAllocation),
        targetAllocation,
        deviation,
        recommendation,
        suggestedActions,
      };
    });

    return { portfolioId, recommendations };
  }

  private async computeCategoryGroup(
    group: Array<typeof assets.$inferSelect>,
    asOfDate: string,
    displayCurrency: string,
    totalValueCny: number,
  ): Promise<{
    currentAllocation: number;
    value: number;
    profitAmount: number;
    yield: number;
    assets: AllocationData['categories'][number]['assets'];
  }> {
    let valueCny = 0;
    let profitCny = 0;

    for (const a of group) {
      const rateToCny = await this.#fx.getRateToCny(a.currency, asOfDate);
      valueCny += fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
      profitCny += fromMoney4(a.dailyProfit4) * rateToCny;
    }

    const currentAllocation = totalValueCny > 0 ? (valueCny / totalValueCny) * 100 : 0;
    const yieldPct = valueCny > 0 ? (profitCny / valueCny) * 100 : 0;

    const value = roundMoney4(await this.#fx.convertMoney(valueCny, 'CNY', displayCurrency, asOfDate));
    const profitAmount = roundMoney4(await this.#fx.convertMoney(profitCny, 'CNY', displayCurrency, asOfDate));

    const assetDtos = await Promise.all(
      group.map(async (a) => {
        const rateToCny = await this.#fx.getRateToCny(a.currency, asOfDate);
        const vCny = fromMoney4(a.currentPrice4) * a.quantity * rateToCny;
        const pCny = fromMoney4(a.dailyProfit4) * rateToCny;
        const v = roundMoney4(await this.#fx.convertMoney(vCny, 'CNY', displayCurrency, asOfDate));
        const p = roundMoney4(await this.#fx.convertMoney(pCny, 'CNY', displayCurrency, asOfDate));
        const y = vCny > 0 ? (pCny / vCny) * 100 : 0;

        return {
          id: a.id,
          symbol: a.symbol,
          name: a.name,
          quantity: a.quantity,
          value: v,
          profitAmount: p,
          yield: roundMoney4(y),
        };
      }),
    );

    return {
      currentAllocation: roundMoney4(currentAllocation),
      value,
      profitAmount,
      yield: roundMoney4(yieldPct),
      assets: assetDtos,
    };
  }
}
