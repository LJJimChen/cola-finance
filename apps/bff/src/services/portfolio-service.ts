import { db } from '../db';
import { portfolios, assets, categories, portfolioHistories } from '../db/schema';
import { eq, and, desc, sum, avg } from 'drizzle-orm';
import { ExchangeRateService } from '../services/exchange-rate-service';
import type { 
  Portfolio, 
  Asset, 
  Category, 
  PortfolioHistory, 
  DashboardData,
  AllocationData
} from '@repo/shared-types';

export interface PortfolioService {
  getDashboardData(userId: string, portfolioId: string, displayCurrency?: string): Promise<DashboardData>;
  getAllocationData(userId: string, portfolioId: string, displayCurrency?: string): Promise<AllocationData>;
  calculatePortfolioMetrics(portfolioId: string): Promise<{
    totalValueCny: number;
    dailyProfitCny: number;
    currentTotalProfitCny: number;
  }>;
}

export class PortfolioServiceImpl implements PortfolioService {
  private exchangeRateService: ExchangeRateService;

  constructor() {
    this.exchangeRateService = new ExchangeRateService(db);
  }

  async getDashboardData(userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<DashboardData> {
    // Verify user owns this portfolio
    const portfolioResult = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    const portfolio = portfolioResult[0];

    // Get all assets in the portfolio
    const assetsResult = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories in the portfolio
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Calculate metrics
    const { totalValueCny, dailyProfitCny, currentTotalProfitCny } = 
      await this.calculatePortfolioMetrics(portfolioId);

    // Convert values to display currency if needed
    let totalValue = totalValueCny;
    let dailyProfit = dailyProfitCny;
    const today = new Date().toISOString().slice(0, 10);

    if (displayCurrency !== 'CNY') {
      totalValue = await this.exchangeRateService.convertMoney(totalValueCny, 'CNY', displayCurrency, today);
      dailyProfit = await this.exchangeRateService.convertMoney(dailyProfitCny, 'CNY', displayCurrency, today);
    }

    // Calculate annual return (simplified calculation)
    const annualReturn = portfolio.totalValueCny > 0 
      ? (currentTotalProfitCny / portfolio.totalValueCny) * 100 
      : 0;

    // Calculate allocation by category
    const allocationByCategory = await this.calculateAllocationByCategory(
      assetsResult, 
      totalValueCny, 
      displayCurrency
    );

    // Get top performing assets
    const topPerformingAssets = [...assetsResult]
      .sort((a, b) => b.dailyProfit - a.dailyProfit)
      .slice(0, 5); // Top 5 performing assets

    return {
      totalValue,
      dailyProfit,
      annualReturn,
      currency: displayCurrency,
      lastUpdated: new Date(),
      allocationByCategory,
      topPerformingAssets: topPerformingAssets as unknown as Asset[],
    };
  }

  async getAllocationData(userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<AllocationData> {
    // Verify user owns this portfolio
    const portfolioResult = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    // Get all assets in the portfolio
    const assetsResult = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories in the portfolio
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Calculate total value in CNY
    const { totalValueCny } = await this.calculatePortfolioMetrics(portfolioId);

    // Convert to display currency if needed
    let displayTotalValue = totalValueCny;
    const today = new Date().toISOString().slice(0, 10);
    if (displayCurrency !== 'CNY') {
      displayTotalValue = await this.exchangeRateService.convertMoney(totalValueCny, 'CNY', displayCurrency, today);
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
      
      // Calculate total value of assets in this category (in CNY)
      let categoryValueCny = 0;
      let categoryProfitAmount = 0;
      for (const asset of categoryAssets) {
        categoryValueCny += asset.currentPrice * asset.quantity;
        categoryProfitAmount += asset.dailyProfit;
      }

      // Convert to display currency if needed
      let displayCategoryValue = categoryValueCny;
      let displayCategoryProfit = categoryProfitAmount;
      if (displayCurrency !== 'CNY') {
        displayCategoryValue = await this.exchangeRateService.convertMoney(categoryValueCny, 'CNY', displayCurrency, today);
        displayCategoryProfit = await this.exchangeRateService.convertMoney(categoryProfitAmount, 'CNY', displayCurrency, today);
      }

      // Calculate allocation percentage
      const currentAllocation = totalValueCny > 0 
        ? (categoryValueCny / totalValueCny) * 100 
        : 0;

      // Calculate yield
      const yieldValue = categoryValueCny > 0 
        ? (categoryProfitAmount / categoryValueCny) * 100 
        : 0;

      // Process individual assets in the category
      const processedAssets = [];
      for (const asset of categoryAssets) {
        let displayAssetValue = asset.currentPrice * asset.quantity;
        let displayAssetProfit = asset.dailyProfit;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await this.exchangeRateService.convertMoney(displayAssetValue, 'CNY', displayCurrency, today);
          displayAssetProfit = await this.exchangeRateService.convertMoney(asset.dailyProfit, 'CNY', displayCurrency, today);
        }

        const assetYield = (asset.currentPrice * asset.quantity) > 0 
          ? (asset.dailyProfit / (asset.currentPrice * asset.quantity)) * 100 
          : 0;

        processedAssets.push({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          quantity: asset.quantity,
          value: displayAssetValue,
          profitAmount: displayAssetProfit,
          yield: assetYield,
        });
      }

      categoriesWithAllocation.push({
        id: category.id,
        name: category.name,
        targetAllocation: category.targetAllocation,
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
      let uncategorizedProfitAmount = 0;
      for (const asset of uncategorizedAssets) {
        uncategorizedValueCny += asset.currentPrice * asset.quantity;
        uncategorizedProfitAmount += asset.dailyProfit;
      }

      let displayUncategorizedValue = uncategorizedValueCny;
      let displayUncategorizedProfit = uncategorizedProfitAmount;
      if (displayCurrency !== 'CNY') {
        displayUncategorizedValue = await this.exchangeRateService.convertMoney(uncategorizedValueCny, 'CNY', displayCurrency, today);
        displayUncategorizedProfit = await this.exchangeRateService.convertMoney(uncategorizedProfitAmount, 'CNY', displayCurrency, today);
      }

      const currentAllocation = totalValueCny > 0 
        ? (uncategorizedValueCny / totalValueCny) * 100 
        : 0;

      const yieldValue = uncategorizedValueCny > 0 
        ? (uncategorizedProfitAmount / uncategorizedValueCny) * 100 
        : 0;

      const processedAssets = [];
      for (const asset of uncategorizedAssets) {
        let displayAssetValue = asset.currentPrice * asset.quantity;
        let displayAssetProfit = asset.dailyProfit;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await this.exchangeRateService.convertMoney(displayAssetValue, 'CNY', displayCurrency, today);
          displayAssetProfit = await this.exchangeRateService.convertMoney(asset.dailyProfit, 'CNY', displayCurrency, today);
        }

        const assetYield = (asset.currentPrice * asset.quantity) > 0 
          ? (asset.dailyProfit / (asset.currentPrice * asset.quantity)) * 100 
          : 0;

        processedAssets.push({
          id: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          quantity: asset.quantity,
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
  }> {
    // Get all assets in the portfolio
    const assetsResult = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Calculate total value in CNY
    let totalValueCny = 0;
    let dailyProfitCny = 0;

    for (const asset of assetsResult) {
      totalValueCny += asset.currentPrice * asset.quantity;
      dailyProfitCny += asset.dailyProfit;
    }

    // Calculate current total profit (simplified - in a real system, you'd need to track initial investment)
    // For now, we'll use daily profit as a proxy for current profit
    const currentTotalProfitCny = dailyProfitCny;

    return {
      totalValueCny,
      dailyProfitCny,
      currentTotalProfitCny,
    };
  }

  private async calculateAllocationByCategory(
    assets: typeof assets[], 
    totalValueCny: number, 
    displayCurrency: string
  ) {
    const allocationByCategory = new Map<string, { 
      categoryName: string; 
      valueCny: number; 
      percentage: number 
    }>();

    for (const asset of assets) {
      const categoryId = asset.categoryId || 'uncategorized';
      const assetValueCny = asset.currentPrice * asset.quantity;

      if (allocationByCategory.has(categoryId)) {
        const existing = allocationByCategory.get(categoryId)!;
        allocationByCategory.set(categoryId, {
          categoryName: existing.categoryName,
          valueCny: existing.valueCny + assetValueCny,
          percentage: 0, // Will recalculate percentages after all values are known
        });
      } else {
        // Need to fetch category name
        if (asset.categoryId) {
          const categoryResult = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, asset.categoryId))
            .limit(1);

          allocationByCategory.set(categoryId, {
            categoryName: categoryResult[0]?.name || 'Uncategorized',
            valueCny: assetValueCny,
            percentage: 0,
          });
        } else {
          allocationByCategory.set(categoryId, {
            categoryName: 'Uncategorized',
            valueCny: assetValueCny,
            percentage: 0,
          });
        }
      }
    }

    // Calculate percentages and convert to display currency
    const result = [];
    const today = new Date().toISOString().slice(0, 10);
    for (const [categoryId, data] of allocationByCategory) {
      const percentage = totalValueCny > 0 ? (data.valueCny / totalValueCny) * 100 : 0;
      
      let displayValue = data.valueCny;
      if (displayCurrency !== 'CNY') {
        displayValue = await this.exchangeRateService.convertMoney(data.valueCny, 'CNY', displayCurrency, today);
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
const portfolioService = new PortfolioServiceImpl();

export { portfolioService };