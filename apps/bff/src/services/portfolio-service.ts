import { portfolios, assets, categories, portfolioHistories } from '../db/schema';
import { eq, and, asc, type InferSelectModel } from 'drizzle-orm';
import { ExchangeRateService } from '../services/exchange-rate-service';
import { fromMoney4, fromQuantity8 } from '../lib/money';
import type { AppDb } from '../db';
import { NotFoundError } from '../lib/errors';
import type { 
  DashboardData,
  AllocationData,
  Asset,
  Portfolio
} from '@repo/shared-types';

function portfolioRowToApi(row: typeof portfolios.$inferSelect): Portfolio {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description ?? undefined,
    totalValueCny: fromMoney4(row.totalValueCny4),
    dailyProfitCny: fromMoney4(row.dailyProfitCny4),
    currentTotalProfitCny: fromMoney4(row.currentTotalProfitCny4),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface PortfolioService {
  getDashboardData(userId: string, portfolioId: string, displayCurrency?: string): Promise<DashboardData>;
  getAllocationData(userId: string, portfolioId: string, displayCurrency?: string): Promise<AllocationData>;
  getPortfolios(userId: string): Promise<Portfolio[]>;
  createPortfolio(userId: string, data: { name: string; description?: string }): Promise<Portfolio>;
  getPortfolio(userId: string, portfolioId: string): Promise<Portfolio>;
  updatePortfolio(userId: string, portfolioId: string, data: { name?: string; description?: string }): Promise<Portfolio>;
  deletePortfolio(userId: string, portfolioId: string): Promise<boolean>;
  calculatePortfolioMetrics(portfolioId: string): Promise<{
    totalValueCny: number;
    dailyProfitCny: number;
    currentTotalProfitCny: number;
    totalCostCny: number;
  }>;
}

export class PortfolioServiceImpl implements PortfolioService {
  constructor(private db: AppDb) {}
  
  async getPortfolios(userId: string): Promise<Portfolio[]> {
    let rows = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .orderBy(asc(portfolios.name));

    // Lazy creation: If user has no portfolios, create a default one
    if (rows.length === 0) {
      const defaultPortfolioId = crypto.randomUUID();
      
      const [newPortfolio] = await this.db
        .insert(portfolios)
        .values({
          id: defaultPortfolioId,
          userId,
          name: 'Default Portfolio',
          description: 'Automatically created default portfolio',
          totalValueCny4: 0,
          dailyProfitCny4: 0,
          currentTotalProfitCny4: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await this.db.insert(portfolioHistories).values({
        id: crypto.randomUUID(),
        portfolioId: defaultPortfolioId,
        timestamp: new Date(),
        totalValueCny4: 0,
        dailyProfitCny4: 0,
        currentTotalProfitCny4: 0,
      });

      rows = [newPortfolio];
    }

    return rows.map(portfolioRowToApi);
  }

  async createPortfolio(userId: string, data: { name: string; description?: string }): Promise<Portfolio> {
    const [row] = await this.db
      .insert(portfolios)
      .values({
        id: crypto.randomUUID(),
        userId,
        name: data.name,
        description: data.description,
        totalValueCny4: 0,
        dailyProfitCny4: 0,
        currentTotalProfitCny4: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    await this.db.insert(portfolioHistories).values({
      id: crypto.randomUUID(),
      portfolioId: row.id,
      timestamp: new Date(),
      totalValueCny4: 0,
      dailyProfitCny4: 0,
      currentTotalProfitCny4: 0,
    });

    return portfolioRowToApi(row);
  }

  async getPortfolio(userId: string, portfolioId: string): Promise<Portfolio> {
    const rows = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundError('Portfolio not found');
    }
    return portfolioRowToApi(rows[0]);
  }

  async updatePortfolio(userId: string, portfolioId: string, data: { name?: string; description?: string }): Promise<Portfolio> {
    const updated = await this.db
      .update(portfolios)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundError('Portfolio not found');
    }

    return portfolioRowToApi(updated[0]);
  }

  async deletePortfolio(userId: string, portfolioId: string): Promise<boolean> {
    const owned = await this.db
      .select({ id: portfolios.id })
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
      
    if (owned.length === 0) {
      throw new NotFoundError('Portfolio not found');
    }

    await this.db.delete(assets).where(eq(assets.portfolioId, portfolioId));
    await this.db.delete(categories).where(eq(categories.portfolioId, portfolioId));
    await this.db.delete(portfolioHistories).where(eq(portfolioHistories.portfolioId, portfolioId));
    await this.db.delete(portfolios).where(eq(portfolios.id, portfolioId));

    return true;
  }
  
  async getDashboardData(userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<DashboardData> {
    const exchangeRateService = new ExchangeRateService(this.db);
    
    // Verify user owns this portfolio
    const portfolioResult = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new NotFoundError('Portfolio not found or access denied');
    }

    // Get all assets in the portfolio
    const assetsResult = await this.db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories for this portfolio (to avoid N+1 in allocation calc)
    const categoriesResult = await this.db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId));
      
    const categoriesMap = new Map<string, string>();
    for (const cat of categoriesResult) {
      categoriesMap.set(cat.id, cat.name);
    }

    // Calculate metrics
    const { totalValueCny, dailyProfitCny, currentTotalProfitCny, totalCostCny } = 
      await this.calculatePortfolioMetrics(portfolioId);

    // Convert values to display currency if needed
    let totalValue = totalValueCny;
    let dailyProfit = dailyProfitCny;
    let totalProfit = currentTotalProfitCny;
    const today = new Date().toISOString().slice(0, 10);

    if (displayCurrency !== 'CNY') {
      totalValue = await exchangeRateService.convertMoney(totalValueCny, 'CNY', displayCurrency, today);
      dailyProfit = await exchangeRateService.convertMoney(dailyProfitCny, 'CNY', displayCurrency, today);
      totalProfit = await exchangeRateService.convertMoney(currentTotalProfitCny, 'CNY', displayCurrency, today);
    }

    // Calculate total return rate (ROI)
    // Note: The field is named 'annualReturn' in the API contract, but we are returning 
    // the Total Return % (Profit / Cost) as it's a more stable and useful metric for the dashboard.
    const annualReturn = totalCostCny > 0 
      ? (currentTotalProfitCny / totalCostCny) * 100 
      : 0;

    // Calculate allocation by category
    const allocationByCategory = await this.calculateAllocationByCategory(
      exchangeRateService,
      assetsResult, 
      categoriesMap,
      totalValueCny, 
      displayCurrency
    );

    // Get top performing assets
    const topPerformingAssets = [...assetsResult]
      .sort((a, b) => fromMoney4(b.dailyProfit4) - fromMoney4(a.dailyProfit4))
      .slice(0, 5); // Top 5 performing assets

    return {
      totalValue,
      dailyProfit,
      annualReturn,
      totalProfit,
      currency: displayCurrency,
      lastUpdated: new Date(),
      allocationByCategory,
      topPerformingAssets: topPerformingAssets as unknown as Asset[],
    };
  }

  async getAllocationData(userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<AllocationData> {
    const exchangeRateService = new ExchangeRateService(this.db);

    // Verify user owns this portfolio
    const portfolioResult = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new NotFoundError('Portfolio not found or access denied');
    }

    // Get all assets in the portfolio
    const assetsResult = await this.db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories in the portfolio
    const categoriesResult = await this.db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId));

    // Calculate total value in CNY
    const { totalValueCny } = await this.calculatePortfolioMetrics(portfolioId);

    // Convert to display currency if needed
    let displayTotalValue = totalValueCny;
    const today = new Date().toISOString().slice(0, 10);
    if (displayCurrency !== 'CNY') {
      displayTotalValue = await exchangeRateService.convertMoney(totalValueCny, 'CNY', displayCurrency, today);
    }

    // Group assets by category
    const assetsByCategory = new Map<string, typeof assetsResult>();
    for (const asset of assetsResult) {
      const categoryId = asset.categoryId || 'uncategorized';
      if (!assetsByCategory.has(categoryId)) {
        assetsByCategory.set(categoryId, []);
      }
      assetsByCategory.get(categoryId)?.push(asset);
    }

    // Calculate allocation data for each category
    const categoriesWithAllocation = [];
    for (const category of categoriesResult) {
      const categoryAssets = assetsByCategory.get(category.id) || [];
      
      // Calculate total value and cost of assets in this category (in CNY)
      let categoryValueCny = 0;
      let categoryCostCny = 0;
      let categoryTotalProfitCny = 0;

      for (const asset of categoryAssets) {
        const currentPrice = fromMoney4(asset.currentPrice4);
        const costBasis = fromMoney4(asset.costBasis4);
        const quantity = fromQuantity8(asset.quantity8);
        
        categoryValueCny += currentPrice * quantity;
        categoryCostCny += costBasis * quantity;
        categoryTotalProfitCny += (currentPrice - costBasis) * quantity;
      }

      // Convert to display currency if needed
      let displayCategoryValue = categoryValueCny;
      let displayCategoryProfit = categoryTotalProfitCny;
      if (displayCurrency !== 'CNY') {
        displayCategoryValue = await exchangeRateService.convertMoney(categoryValueCny, 'CNY', displayCurrency, today);
        displayCategoryProfit = await exchangeRateService.convertMoney(categoryTotalProfitCny, 'CNY', displayCurrency, today);
      }

      // Calculate allocation percentage
      const currentAllocation = totalValueCny > 0 
        ? (categoryValueCny / totalValueCny) * 100 
        : 0;

      // Calculate yield (Total Return %)
      const yieldValue = categoryCostCny > 0 
        ? (categoryTotalProfitCny / categoryCostCny) * 100 
        : 0;

      // Process individual assets in the category
      const processedAssets = [];
      for (const asset of categoryAssets) {
        const currentPrice = fromMoney4(asset.currentPrice4);
        const costBasis = fromMoney4(asset.costBasis4);
        const quantity = fromQuantity8(asset.quantity8);
        
        const assetTotalProfitCny = (currentPrice - costBasis) * quantity;
        const assetValueCny = currentPrice * quantity;
        
        let displayAssetValue = assetValueCny;
        let displayAssetProfit = assetTotalProfitCny;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await exchangeRateService.convertMoney(assetValueCny, 'CNY', displayCurrency, today);
          displayAssetProfit = await exchangeRateService.convertMoney(assetTotalProfitCny, 'CNY', displayCurrency, today);
        }

        const assetCostCny = costBasis * quantity;
        const assetYield = assetCostCny > 0 
          ? (assetTotalProfitCny / assetCostCny) * 100 
          : 0;

        processedAssets.push({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          quantity: quantity,
          value: displayAssetValue,
          profitAmount: displayAssetProfit,
          yield: assetYield,
        });
      }

      categoriesWithAllocation.push({
        id: category.id,
        name: category.name,
        targetAllocation: category.targetAllocationBps / 100,
        currentAllocation,
        value: displayCategoryValue,
        profitAmount: displayCategoryProfit,
        yield: yieldValue,
        assets: processedAssets,
      });
    }

    // Handle uncategorized assets
    const uncategorizedAssets = assetsByCategory.get('uncategorized') || [];
    if (uncategorizedAssets.length > 0) {
      let uncategorizedValueCny = 0;
      let uncategorizedCostCny = 0;
      let uncategorizedTotalProfitCny = 0;

      for (const asset of uncategorizedAssets) {
        const currentPrice = fromMoney4(asset.currentPrice4);
        const costBasis = fromMoney4(asset.costBasis4);
        const quantity = fromQuantity8(asset.quantity8);
        
        uncategorizedValueCny += currentPrice * quantity;
        uncategorizedCostCny += costBasis * quantity;
        uncategorizedTotalProfitCny += (currentPrice - costBasis) * quantity;
      }

      let displayUncategorizedValue = uncategorizedValueCny;
      let displayUncategorizedProfit = uncategorizedTotalProfitCny;
      if (displayCurrency !== 'CNY') {
        displayUncategorizedValue = await exchangeRateService.convertMoney(uncategorizedValueCny, 'CNY', displayCurrency, today);
        displayUncategorizedProfit = await exchangeRateService.convertMoney(uncategorizedTotalProfitCny, 'CNY', displayCurrency, today);
      }

      const currentAllocation = totalValueCny > 0 
        ? (uncategorizedValueCny / totalValueCny) * 100 
        : 0;

      const yieldValue = uncategorizedCostCny > 0 
        ? (uncategorizedTotalProfitCny / uncategorizedCostCny) * 100 
        : 0;

      const processedAssets = [];
      for (const asset of uncategorizedAssets) {
        const currentPrice = fromMoney4(asset.currentPrice4);
        const costBasis = fromMoney4(asset.costBasis4);
        const quantity = fromQuantity8(asset.quantity8);
        
        const assetTotalProfitCny = (currentPrice - costBasis) * quantity;
        const assetValueCny = currentPrice * quantity;
        
        let displayAssetValue = assetValueCny;
        let displayAssetProfit = assetTotalProfitCny;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await exchangeRateService.convertMoney(assetValueCny, 'CNY', displayCurrency, today);
          displayAssetProfit = await exchangeRateService.convertMoney(assetTotalProfitCny, 'CNY', displayCurrency, today);
        }

        const assetCostCny = costBasis * quantity;
        const assetYield = assetCostCny > 0 
          ? (assetTotalProfitCny / assetCostCny) * 100 
          : 0;

        processedAssets.push({
          id: 'uncategorized',
          symbol: asset.symbol,
          name: asset.name,
          quantity: quantity,
          value: displayAssetValue,
          profitAmount: displayAssetProfit,
          yield: assetYield,
        });
      }

      categoriesWithAllocation.push({
        id: 'uncategorized',
        name: 'Uncategorized',
        targetAllocation: 0,
        currentAllocation,
        value: displayUncategorizedValue,
        profitAmount: displayUncategorizedProfit,
        yield: yieldValue,
        assets: processedAssets,
      });
    }

    return {
      totalValue: displayTotalValue,
      currency: displayCurrency,
      categories: categoriesWithAllocation,
    };
  }

  async calculatePortfolioMetrics(portfolioId: string): Promise<{
    totalValueCny: number;
    dailyProfitCny: number;
    currentTotalProfitCny: number;
    totalCostCny: number;
  }> {
    // Get all assets in the portfolio
    const assetsResult = await this.db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Calculate total value in CNY
    let totalValueCny = 0;
    let dailyProfitCny = 0;
    let currentTotalProfitCny = 0;
    let totalCostCny = 0;

    for (const asset of assetsResult) {
      const currentPrice = fromMoney4(asset.currentPrice4);
      const costBasis = fromMoney4(asset.costBasis4);
      const dailyProfit = fromMoney4(asset.dailyProfit4);
      const quantity = fromQuantity8(asset.quantity8);

      totalValueCny += currentPrice * quantity;
      dailyProfitCny += dailyProfit;
      totalCostCny += costBasis * quantity;
      currentTotalProfitCny += (currentPrice - costBasis) * quantity;
    }

    return {
      totalValueCny,
      dailyProfitCny,
      currentTotalProfitCny,
      totalCostCny,
    };
  }

  private async calculateAllocationByCategory(
    exchangeRateService: ExchangeRateService,
    assetList: InferSelectModel<typeof assets>[], 
    categoriesMap: Map<string, string>,
    totalValueCny: number, 
    displayCurrency: string
  ) {
    const allocationByCategory = new Map<string, { 
      categoryName: string; 
      valueCny: number; 
      percentage: number 
    }>();

    for (const asset of assetList) {
      const categoryId = asset.categoryId || 'uncategorized';
      const currentPrice = fromMoney4(asset.currentPrice4);
      const assetValueCny = currentPrice * fromQuantity8(asset.quantity8);

      if (allocationByCategory.has(categoryId)) {
        const existing = allocationByCategory.get(categoryId)!;
        allocationByCategory.set(categoryId, {
          categoryName: existing.categoryName,
          valueCny: existing.valueCny + assetValueCny,
          percentage: 0, // Will recalculate percentages after all values are known
        });
      } else {
        const categoryName = categoriesMap.get(categoryId) || 'Uncategorized';
        allocationByCategory.set(categoryId, {
          categoryName: categoryName,
          valueCny: assetValueCny,
          percentage: 0,
        });
      }
    }

    // Calculate percentages and convert to display currency
    const result = [];
    const today = new Date().toISOString().slice(0, 10);
    for (const data of allocationByCategory.values()) {
      const percentage = totalValueCny > 0 ? (data.valueCny / totalValueCny) * 100 : 0;
      
      let displayValue = data.valueCny;
      if (displayCurrency !== 'CNY') {
        displayValue = await exchangeRateService.convertMoney(data.valueCny, 'CNY', displayCurrency, today);
      }

      result.push({
        categoryName: data.categoryName,
        percentage,
        value: displayValue,
      });
    }

    return result;
  }
}

// Create a singleton instance
// const portfolioService = new PortfolioServiceImpl();

// export { portfolioService };
