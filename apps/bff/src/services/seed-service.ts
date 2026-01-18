import type { AppDb } from '../db';
import { assets, categories, exchangeRates, portfolios } from '../db/schema';
import { toMoney4, toRate8 } from '../lib/money';
import { AppError } from '../lib/errors';
import { PortfolioMetricsService } from './portfolio-metrics-service';

type SeedArgs = {
  userId: string;
  now: string;
};

export async function seedNewUser(db: AppDb, args: SeedArgs): Promise<void> {
  const defaultPortfolioId = crypto.randomUUID();

  await db.insert(portfolios).values({
    id: defaultPortfolioId,
    userId: args.userId,
    name: 'My Portfolio',
    description: 'Seeded demo portfolio',
    totalValueCny4: 0,
    dailyProfitCny4: 0,
    currentTotalProfitCny4: 0,
    createdAt: args.now,
    updatedAt: args.now,
  });

  const defaultCategories = [
    { name: 'US equities', targetAllocationBps: 25_00 },
    { name: 'China equities', targetAllocationBps: 20_00 },
    { name: 'Asia-Pacific equities', targetAllocationBps: 15_00 },
    { name: 'Commodities', targetAllocationBps: 10_00 },
    { name: 'Dividend income', targetAllocationBps: 10_00 },
    { name: 'Bonds', targetAllocationBps: 20_00 },
  ] as const;

  const categoryIdsByName = new Map<string, string>();
  for (const c of defaultCategories) {
    const id = crypto.randomUUID();
    categoryIdsByName.set(c.name, id);
    await db.insert(categories).values({
      id,
      userId: args.userId,
      portfolioId: defaultPortfolioId,
      name: c.name,
      targetAllocationBps: c.targetAllocationBps,
      currentAllocationBps: 0,
      createdAt: args.now,
      updatedAt: args.now,
    });
  }

  const today = args.now.slice(0, 10);
  const fxSeed = [
    { source: 'USD', target: 'CNY', rate: 7.2000 },
    { source: 'HKD', target: 'CNY', rate: 0.9200 },
    { source: 'JPY', target: 'CNY', rate: 0.0500 },
    { source: 'CNY', target: 'CNY', rate: 1.0 },
  ] as const;

  for (const fx of fxSeed) {
    await db.insert(exchangeRates).values({
      id: crypto.randomUUID(),
      sourceCurrency: fx.source,
      targetCurrency: fx.target,
      rate8: toRate8(fx.rate),
      date: today,
      createdAt: args.now,
    });
  }

  const demoAssets = [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      quantity: 10,
      costBasis: 170,
      currentPrice: 190,
      dailyProfit: 12,
      currency: 'USD',
      brokerSource: 'mock',
      categoryName: 'US equities',
    },
    {
      symbol: 'BABA',
      name: 'Alibaba',
      quantity: 30,
      costBasis: 80,
      currentPrice: 76,
      dailyProfit: -15,
      currency: 'USD',
      brokerSource: 'mock',
      categoryName: 'China equities',
    },
    {
      symbol: '600519.SS',
      name: '贵州茅台',
      quantity: 2,
      costBasis: 1680,
      currentPrice: 1710,
      dailyProfit: 20,
      currency: 'CNY',
      brokerSource: 'mock',
      categoryName: 'China equities',
    },
    {
      symbol: 'TLT',
      name: 'iShares 20+ Year Treasury Bond ETF',
      quantity: 5,
      costBasis: 92,
      currentPrice: 95,
      dailyProfit: 3,
      currency: 'USD',
      brokerSource: 'mock',
      categoryName: 'Bonds',
    },
  ] as const;

  for (const asset of demoAssets) {
    const categoryId = categoryIdsByName.get(asset.categoryName);
    if (!categoryId) {
      throw new AppError({ status: 500, code: 'INTERNAL_ERROR', message: 'Seed category missing' });
    }

    await db.insert(assets).values({
      id: crypto.randomUUID(),
      userId: args.userId,
      portfolioId: defaultPortfolioId,
      categoryId,
      symbol: asset.symbol,
      name: asset.name,
      quantity: asset.quantity,
      costBasis4: toMoney4(asset.costBasis),
      dailyProfit4: toMoney4(asset.dailyProfit),
      currentPrice4: toMoney4(asset.currentPrice),
      currency: asset.currency,
      brokerSource: asset.brokerSource,
      createdAt: args.now,
      updatedAt: args.now,
    });
  }

  const metrics = new PortfolioMetricsService(db);
  await metrics.recomputeAndPersist(args.userId, defaultPortfolioId, { asOfUtc: args.now });
}
