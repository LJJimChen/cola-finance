import type { AppDb } from '../db';
import { categories, assets, exchangeRates, portfolioHistories, portfolios } from '../db/schema';
import { toMoney4, toRate8, toQuantity8 } from '../lib/money';
import { PortfolioMetricsService } from './portfolio-metrics-service';
import { etfData } from './etf-data';
import { randomUUID } from 'node:crypto';

type SeedArgs = {
  userId: string;
  now: string;
};

export async function seedNewUser(db: AppDb, args: SeedArgs): Promise<void> {
  // 1. Seed Exchange Rates (Global for user context, though rates are technically shared data, 
  // here we just seed some initial ones if we are treating this as a fresh env or user-specific view)
  // Note: In a real system, exchange rates might be a shared table populated by a cron job. 
  // Here we insert them assuming the table might be empty or we just want to ensure these exist.
  // Since IDs are random, we might duplicate if we are not careful, but for "seedNewUser" we assume a fresh start or we just add them.
  // Actually, for a multi-user system, exchange rates should probably be seeded once globally. 
  // However, based on existing code, it inserts them. Let's keep it but maybe we should check if they exist? 
  // For simplicity in this "demo" context, we'll just insert them.
  
  const today = args.now.slice(0, 10);
  const fxSeed = [
    { source: 'USD', target: 'CNY', rate: 7.2000 },
    { source: 'HKD', target: 'CNY', rate: 0.9200 },
    { source: 'JPY', target: 'CNY', rate: 0.0500 },
    { source: 'EUR', target: 'CNY', rate: 7.8000 },
    { source: 'GBP', target: 'CNY', rate: 9.1000 },
    { source: 'CNY', target: 'CNY', rate: 1.0 },
  ] as const;

  for (const fx of fxSeed) {
    // We generate a random ID, so this will always insert new rows. 
    // In a real app, this table shouldn't be user-scoped or seeded per user.
    // But following existing pattern for now.
    await db.insert(exchangeRates).values({
      id: randomUUID(),
      sourceCurrency: fx.source,
      targetCurrency: fx.target,
      rate8: toRate8(fx.rate),
      date: new Date(today),
      createdAt: new Date(args.now),
    });
  }

  // 2. Define Main Portfolio
  const portfolioId = randomUUID();
  const now = args.now;
  const nowDate = new Date(now);

  await db.insert(portfolios).values({
    id: portfolioId,
    userId: args.userId,
    name: 'Main Portfolio',
    description: 'Combined investments including ETFs',
    totalValueCny4: toMoney4(0),
    dailyProfitCny4: toMoney4(0),
    currentTotalProfitCny4: toMoney4(0),
    createdAt: nowDate,
    updatedAt: nowDate,
  });

  // 3. Define Categories
  const categoriesList = [
    { name: 'US Equities', target: 30_00 },
    { name: 'China Equities', target: 30_00 },
    { name: 'Bonds', target: 20_00 },
    { name: 'Japan Equities', target: 10_00 },
    { name: 'Global Tech', target: 10_00 },
    { name: 'Cash', target: 0 },
  ];

  const categoryIdsByName = new Map<string, string>();
  for (const c of categoriesList) {
    const catId = randomUUID();
    categoryIdsByName.set(c.name, catId);
    await db.insert(categories).values({
      id: catId,
      portfolioId: portfolioId,
      name: c.name,
      targetAllocationBps: c.target,
      currentAllocationBps: 0,
      createdAt: nowDate,
      updatedAt: nowDate,
    });
  }

  // 4. Shared Capital Management
  const INITIAL_CAPITAL = 100_000;
  const MAX_ALLOCATION_PER_ASSET = INITIAL_CAPITAL / 20;
  let remainingCash = INITIAL_CAPITAL;

  // Helper for FX rates
  const fxRates = new Map<string, number>();
  for (const fx of fxSeed) {
    if (fx.target === 'CNY') {
      fxRates.set(fx.source, fx.rate);
    }
  }

  // 5. Seed Manual Assets
  const manualAssets = [
    { 
      symbol: 'AAPL', name: 'Apple Inc.', cost: 175, price: 185, 
      currency: 'USD', cat: 'US Equities', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
    },
    { 
      symbol: 'MSFT', name: 'Microsoft', cost: 320, price: 410, 
      currency: 'USD', cat: 'US Equities', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
    },
    { 
      symbol: 'BABA', name: 'Alibaba', cost: 85, price: 72, 
      currency: 'USD', cat: 'China Equities', brokerSource: 'Futu', brokerAccount: 'F888888' 
    },
    { 
      symbol: '0700.HK', name: 'Tencent', cost: 320, price: 290, 
      currency: 'HKD', cat: 'China Equities', brokerSource: 'Futu', brokerAccount: 'F888888' 
    },
    { 
      symbol: 'TLT', name: '20+ Year Treasury Bond ETF', cost: 98, price: 92, 
      currency: 'USD', cat: 'Bonds', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
    },
  ];

  for (const asset of manualAssets) {
    const rate = fxRates.get(asset.currency) || 1.0;
    const costInCny = asset.cost * rate;
    
    // Calculate quantity based on max allocation
    const quantity = Math.floor(MAX_ALLOCATION_PER_ASSET / costInCny);
    
    if (quantity > 0) {
      remainingCash -= quantity * costInCny;
      const categoryId = categoryIdsByName.get(asset.cat)!;
      const dailyProfit = (asset.price - asset.cost) * 0.1; 

      await db.insert(assets).values({
        id: randomUUID(),
        portfolioId: portfolioId,
        categoryId,
        symbol: asset.symbol,
        name: asset.name,
        quantity8: toQuantity8(quantity),
        costBasis4: toMoney4(asset.cost),
        dailyProfit4: toMoney4(dailyProfit),
        currentPrice4: toMoney4(asset.price),
        currency: asset.currency,
        brokerSource: asset.brokerSource,
        brokerAccount: asset.brokerAccount,
        createdAt: nowDate,
        updatedAt: nowDate,
      });
    }
  }

  // 6. Seed ETF Assets
  const assetAllocations = new Map<string, { quantity: number, costBasis: number }>();
  
  for (const [symbol, data] of Object.entries(etfData)) {
    if (data.history.length === 0) continue;
    
    // ETF data is in CNY (implied), so rate is 1.0
    // Check if we have enough cash left for at least 1 unit, but bounded by MAX_ALLOCATION_PER_ASSET
    // Actually, the rule is "Max 1 part per asset", not "Must spend 1 part".
    // And also bounded by remainingCash.
    
    const firstPoint = data.history[0];
    const price = firstPoint.price;
    
    // Max quantity allowed by the 1/20 rule
    const maxQuantityByRule = Math.floor(MAX_ALLOCATION_PER_ASSET / price);
    // Max quantity allowed by remaining cash (though we probably want to reserve cash for all assets? 
    // The user said "Divide into 20 parts", usually means "Allocate 1/20 to each". 
    // If remaining cash runs out, we stop.
    
    if (remainingCash < price) continue;
    
    // We use the rule limit, but also check if we have enough cash
    let quantity = maxQuantityByRule;
    if (quantity * price > remainingCash) {
      quantity = Math.floor(remainingCash / price);
    }
    
    if (quantity > 0) {
      assetAllocations.set(symbol, { quantity, costBasis: price });
      remainingCash -= quantity * price;
    }
  }

  const allDates = new Set<string>();
  const priceMap = new Map<string, Map<string, number>>();

  for (const [symbol, data] of Object.entries(etfData)) {
    if (!assetAllocations.has(symbol)) continue;
    
    const allocation = assetAllocations.get(symbol)!;
    const lastPoint = data.history[data.history.length - 1];
    const prevPoint = data.history.length > 1 ? data.history[data.history.length - 2] : lastPoint;
    const dailyProfit = (lastPoint.price - prevPoint.price) * allocation.quantity;

    // Determine Category
    let categoryName = 'China Equities'; // Default
    if (data.name.includes('纳斯达克')) categoryName = 'US Equities';
    else if (data.name.includes('日经')) categoryName = 'Japan Equities';
    else if (data.name.includes('芯片')) categoryName = 'Global Tech';
    
    const categoryId = categoryIdsByName.get(categoryName)!;

    await db.insert(assets).values({
      id: randomUUID(),
      portfolioId: portfolioId,
      categoryId,
      symbol: symbol,
      name: data.name,
      quantity8: toQuantity8(allocation.quantity),
      costBasis4: toMoney4(allocation.costBasis),
      dailyProfit4: toMoney4(dailyProfit),
      currentPrice4: toMoney4(lastPoint.price),
      currency: 'CNY',
      brokerSource: 'Manual',
      brokerAccount: 'CSV-Import',
      createdAt: nowDate,
      updatedAt: nowDate,
    });

    for (const point of data.history) {
      allDates.add(point.date);
      if (!priceMap.has(point.date)) priceMap.set(point.date, new Map());
      priceMap.get(point.date)!.set(symbol, point.price);
    }
  }

  // 6. Seed Cash Asset
  if (remainingCash > 0) {
    await db.insert(assets).values({
      id: randomUUID(),
      portfolioId: portfolioId,
      categoryId: categoryIdsByName.get('Cash')!,
      symbol: 'CNY',
      name: 'Chinese Yuan',
      quantity8: toQuantity8(remainingCash),
      costBasis4: toMoney4(1),
      dailyProfit4: toMoney4(0),
      currentPrice4: toMoney4(1),
      currency: 'CNY',
      brokerSource: 'Bank',
      brokerAccount: 'Savings',
      createdAt: nowDate,
      updatedAt: nowDate,
    });
  }

  // 7. Generate Portfolio History
  const sortedDates = Array.from(allDates).sort();
  const lastKnownPrices = new Map<string, number>();
  let prevTotalValue = 0;

  for (const date of sortedDates) {
    const todaysPrices = priceMap.get(date);
    if (todaysPrices) {
      for (const [symbol, price] of todaysPrices) {
        lastKnownPrices.set(symbol, price);
      }
    }

    let currentCash = INITIAL_CAPITAL;
    let assetsValue = 0;

    for (const [symbol, alloc] of assetAllocations) {
      const assetData = etfData[symbol];
      if (assetData && assetData.history.length > 0) {
        const startDate = assetData.history[0].date;
        if (date >= startDate && lastKnownPrices.has(symbol)) {
           const currentPrice = lastKnownPrices.get(symbol)!;
           const cost = alloc.quantity * alloc.costBasis;
           currentCash -= cost;
           assetsValue += alloc.quantity * currentPrice;
        }
      }
    }

    const totalValue = currentCash + assetsValue;
    let dailyProfit = totalValue - prevTotalValue;
    if (prevTotalValue === 0) dailyProfit = 0;
    const currentTotalProfit = totalValue - INITIAL_CAPITAL;

    await db.insert(portfolioHistories).values({
      id: randomUUID(),
      portfolioId: portfolioId,
      timestamp: new Date(date),
      totalValueCny4: toMoney4(totalValue),
      dailyProfitCny4: toMoney4(dailyProfit),
      currentTotalProfitCny4: toMoney4(currentTotalProfit),
    });

    prevTotalValue = totalValue;
  }

  // 8. Compute Metrics
  const metrics = new PortfolioMetricsService(db);
  await metrics.recomputeAndPersist(args.userId, portfolioId, { asOfUtc: now });
}
