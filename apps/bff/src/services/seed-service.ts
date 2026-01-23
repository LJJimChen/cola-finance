import type { AppDb } from '../db';
import { assets, categories, exchangeRates, portfolioHistories, portfolios } from '../db/schema';
import { toMoney4, toRate8 } from '../lib/money';
import { AppError } from '../lib/errors';
import { PortfolioMetricsService } from './portfolio-metrics-service';
import { etfData } from './etf-data';

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
      id: crypto.randomUUID(),
      sourceCurrency: fx.source,
      targetCurrency: fx.target,
      rate8: toRate8(fx.rate),
      date: today,
      createdAt: args.now,
    });
  }

  // 2. Define Portfolios Data
  const portfoliosData = [
    {
      name: 'Main Portfolio',
      description: 'Core long-term investments',
      categories: [
        { name: 'US Equities', target: 40_00 },
        { name: 'China Equities', target: 30_00 },
        { name: 'Bonds', target: 30_00 },
      ],
      assets: [
        { 
          symbol: 'AAPL', name: 'Apple Inc.', quantity: 15, cost: 175, price: 185, 
          currency: 'USD', cat: 'US Equities', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
        },
        { 
          symbol: 'MSFT', name: 'Microsoft', quantity: 10, cost: 320, price: 410, 
          currency: 'USD', cat: 'US Equities', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
        },
        { 
          symbol: 'BABA', name: 'Alibaba', quantity: 50, cost: 85, price: 72, 
          currency: 'USD', cat: 'China Equities', brokerSource: 'Futu', brokerAccount: 'F888888' 
        },
        { 
          symbol: '0700.HK', name: 'Tencent', quantity: 200, cost: 320, price: 290, 
          currency: 'HKD', cat: 'China Equities', brokerSource: 'Futu', brokerAccount: 'F888888' 
        },
        { 
          symbol: 'TLT', name: '20+ Year Treasury Bond ETF', quantity: 40, cost: 98, price: 92, 
          currency: 'USD', cat: 'Bonds', brokerSource: 'IBKR', brokerAccount: 'U1234567' 
        },
      ]
    },
    {
      name: 'Growth Bets',
      description: 'High risk high reward speculative assets',
      categories: [
        { name: 'Tech Growth', target: 60_00 },
        { name: 'Crypto Proxies', target: 40_00 },
      ],
      assets: [
        { 
          symbol: 'NVDA', name: 'NVIDIA', quantity: 5, cost: 450, price: 720, 
          currency: 'USD', cat: 'Tech Growth', brokerSource: 'Robinhood', brokerAccount: 'R555555' 
        },
        { 
          symbol: 'PLTR', name: 'Palantir', quantity: 100, cost: 15, price: 22, 
          currency: 'USD', cat: 'Tech Growth', brokerSource: 'Robinhood', brokerAccount: 'R555555' 
        },
        { 
          symbol: 'COIN', name: 'Coinbase', quantity: 30, cost: 120, price: 180, 
          currency: 'USD', cat: 'Crypto Proxies', brokerSource: 'Robinhood', brokerAccount: 'R555555' 
        },
      ]
    }
  ];

  // 3. Loop and Insert Portfolios, Categories, and Assets
  const metrics = new PortfolioMetricsService(db);

  for (const pData of portfoliosData) {
    const portfolioId = crypto.randomUUID();

    // Create Portfolio
    await db.insert(portfolios).values({
      id: portfolioId,
      userId: args.userId,
      name: pData.name,
      description: pData.description,
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
      createdAt: args.now,
      updatedAt: args.now,
    });

    // Create Categories and map name -> id
    const categoryIdsByName = new Map<string, string>();
    for (const c of pData.categories) {
      const catId = crypto.randomUUID();
      categoryIdsByName.set(c.name, catId);
      await db.insert(categories).values({
        id: catId,
        portfolioId: portfolioId, // Correctly linked to portfolio
        name: c.name,
        targetAllocationBps: c.target,
        currentAllocationBps: 0,
        createdAt: args.now,
        updatedAt: args.now,
      });
    }

    // Create Assets
    for (const asset of pData.assets) {
      const categoryId = categoryIdsByName.get(asset.cat);
      if (!categoryId) {
        throw new AppError({ status: 500, code: 'INTERNAL_ERROR', message: `Seed category missing: ${asset.cat}` });
      }

      // Calculate simple daily profit approximation for seed data
      // (Current - Cost) / Days? Or just arbitrary? 
      // The original code had explicit dailyProfit. 
      // Let's approximate daily change as (Current Price * 0.01 * random direction) or just static logic.
      // For simplicity, let's assume daily profit is just (Price - Cost) * 0.05 (totally fake)
      // Or better, let's just make it up based on the asset for variety.
      const dailyProfit = (asset.price - asset.cost) * 0.1; // 10% of total gain is daily change? A bit high but visible.

      await db.insert(assets).values({
        id: crypto.randomUUID(),
        portfolioId: portfolioId,
        categoryId,
        symbol: asset.symbol,
        name: asset.name,
        quantity: asset.quantity,
        costBasis4: toMoney4(asset.cost),
        dailyProfit4: toMoney4(dailyProfit),
        currentPrice4: toMoney4(asset.price),
        currency: asset.currency,
        brokerSource: asset.brokerSource,
        brokerAccount: asset.brokerAccount,
        createdAt: args.now,
        updatedAt: args.now,
      });
    }

    // Compute Metrics for this portfolio
    await metrics.recomputeAndPersist(args.userId, portfolioId, { asOfUtc: args.now });
  }

  // 4. Seed ETF Portfolio from CSV History
  const etfPortfolioId = crypto.randomUUID();
  await db.insert(portfolios).values({
    id: etfPortfolioId,
    userId: args.userId,
    name: 'ETF Portfolio',
    description: 'Imported from ETF history CSVs',
    totalValueCny4: 0,
    dailyProfitCny4: 0,
    currentTotalProfitCny4: 0,
    createdAt: args.now,
    updatedAt: args.now,
  });

  const etfCategoryId = crypto.randomUUID();
  await db.insert(categories).values({
    id: etfCategoryId,
    portfolioId: etfPortfolioId,
    name: 'Sector ETFs',
    targetAllocationBps: 100_00,
    currentAllocationBps: 0,
    createdAt: args.now,
    updatedAt: args.now,
  });

  const INITIAL_CAPITAL = 100_000;
  const PER_TRADE_CAPITAL = 10_000;
  let remainingCash = INITIAL_CAPITAL;

  // Determine which assets to buy and how much
  const assetAllocations = new Map<string, { quantity: number, costBasis: number }>();
  
  for (const [symbol, data] of Object.entries(etfData)) {
    if (data.history.length === 0) continue;
    if (remainingCash < PER_TRADE_CAPITAL) break; // Not enough cash to buy more

    const firstPoint = data.history[0];
    const price = firstPoint.price;
    const quantity = Math.floor(PER_TRADE_CAPITAL / price);
    
    if (quantity > 0) {
      assetAllocations.set(symbol, {
        quantity,
        costBasis: price
      });
      remainingCash -= quantity * price;
    }
  }

  const allDates = new Set<string>();
  const priceMap = new Map<string, Map<string, number>>(); // date -> symbol -> price

  // Insert Assets
  for (const [symbol, data] of Object.entries(etfData)) {
    if (!assetAllocations.has(symbol)) continue; // Skip if not allocated
    
    const allocation = assetAllocations.get(symbol)!;
    const lastPoint = data.history[data.history.length - 1];
    const prevPoint = data.history.length > 1 ? data.history[data.history.length - 2] : lastPoint;

    // Daily profit for the asset today (change in value)
    const dailyProfit = (lastPoint.price - prevPoint.price) * allocation.quantity;

    await db.insert(assets).values({
      id: crypto.randomUUID(),
      portfolioId: etfPortfolioId,
      categoryId: etfCategoryId,
      symbol: symbol,
      name: data.name,
      quantity: allocation.quantity,
      costBasis4: toMoney4(allocation.costBasis),
      dailyProfit4: toMoney4(dailyProfit),
      currentPrice4: toMoney4(lastPoint.price),
      currency: 'CNY',
      brokerSource: 'Manual',
      brokerAccount: 'CSV-Import',
      createdAt: args.now,
      updatedAt: args.now,
    });

    // Populate price map for history
    for (const point of data.history) {
      allDates.add(point.date);
      if (!priceMap.has(point.date)) {
        priceMap.set(point.date, new Map());
      }
      priceMap.get(point.date)!.set(symbol, point.price);
    }
  }

  // Generate Portfolio History
  const sortedDates = Array.from(allDates).sort();
  
  // To fill forward, keep track of last known prices
  const lastKnownPrices = new Map<string, number>();

  // Helper to get previous date's value for daily profit calc
  let prevTotalValue = 0;

  for (const date of sortedDates) {
    // Update last known prices with today's data
    const todaysPrices = priceMap.get(date);
    if (todaysPrices) {
      for (const [symbol, price] of todaysPrices) {
        lastKnownPrices.set(symbol, price);
      }
    }

    // Calculate total value
    // Total Value = Cash + Sum(Asset Value)
    // Cash starts at INITIAL_CAPITAL and decreases as assets are "bought"
    // Buying happens on the first day data is available for an asset
    
    let currentCash = INITIAL_CAPITAL;
    let assetsValue = 0;
    let investedCost = 0;

    for (const [symbol, alloc] of assetAllocations) {
      // Check if this asset has "started" trading yet (has a price known)
      // AND if the current date is >= asset start date.
      // Since we iterate sorted dates, if we have a price for it in lastKnownPrices, 
      // it means it has started trading (or we have filled forward).
      // However, strict logic: buy on the FIRST day data appears.
      
      // Better check: is date >= asset's first history date?
      const assetData = etfData[symbol];
      if (assetData && assetData.history.length > 0) {
        const startDate = assetData.history[0].date;
        if (date >= startDate && lastKnownPrices.has(symbol)) {
           // Asset is bought
           const currentPrice = lastKnownPrices.get(symbol)!;
           const cost = alloc.quantity * alloc.costBasis;
           
           currentCash -= cost;
           assetsValue += alloc.quantity * currentPrice;
           investedCost += cost;
        }
      }
    }

    const totalValue = currentCash + assetsValue;
    
    // Daily profit = Change in Total Value
    // Note: Since cash decreases and asset value increases by same amount on buy day (ignoring price change on day 1),
    // Total Value should be continuous.
    let dailyProfit = totalValue - prevTotalValue;
    if (prevTotalValue === 0) dailyProfit = 0;

    // Current Total Profit = Current Value - Initial Capital
    // (Or Current Value - (Initial Capital + Deposits)), here Deposits=0
    const currentTotalProfit = totalValue - INITIAL_CAPITAL;

    await db.insert(portfolioHistories).values({
      id: crypto.randomUUID(),
      portfolioId: etfPortfolioId,
      timestampUtc: new Date(date).toISOString(),
      totalValueCny4: toMoney4(totalValue),
      dailyProfitCny4: toMoney4(dailyProfit),
      currentTotalProfitCny4: toMoney4(currentTotalProfit),
    });

    prevTotalValue = totalValue;
  }

  // Final recompute for the ETF portfolio to ensure consistency
  await metrics.recomputeAndPersist(args.userId, etfPortfolioId, { asOfUtc: args.now });
}
