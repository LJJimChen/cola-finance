import { portfolios, assets, categories } from '../db/schema';
import { eq, and, type InferSelectModel } from 'drizzle-orm';
import { ExchangeRateService } from '../services/exchange-rate-service';
import { fromMoney4 } from '../lib/money';
import type { AppDb } from '../db';
import type { 
  DashboardData,
  AllocationData,
  Asset
} from '@repo/shared-types';

export interface PortfolioService {
  getDashboardData(db: AppDb, userId: string, portfolioId: string, displayCurrency?: string): Promise<DashboardData>;
  getAllocationData(db: AppDb, userId: string, portfolioId: string, displayCurrency?: string): Promise<AllocationData>;
  calculatePortfolioMetrics(db: AppDb, portfolioId: string): Promise<{
    totalValueCny: number;
    dailyProfitCny: number;
    currentTotalProfitCny: number;
    totalCostCny: number;
  }>;
}

export class PortfolioServiceImpl implements PortfolioService {
  
  async getDashboardData(db: AppDb, userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<DashboardData> {
    const exchangeRateService = new ExchangeRateService(db);
    
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

    // Get all categories for this portfolio (to avoid N+1 in allocation calc)
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId));
      
    const categoriesMap = new Map<string, string>();
    for (const cat of categoriesResult) {
      categoriesMap.set(cat.id, cat.name);
    }

    // Calculate metrics
    const { totalValueCny, dailyProfitCny, currentTotalProfitCny, totalCostCny } = 
      await this.calculatePortfolioMetrics(db, portfolioId);

    // Convert values to display currency if needed
    let totalValue = totalValueCny;
    let dailyProfit = dailyProfitCny;
    const today = new Date().toISOString().slice(0, 10);

    if (displayCurrency !== 'CNY') {
      totalValue = await exchangeRateService.convertMoney(totalValueCny, 'CNY', displayCurrency, today);
      dailyProfit = await exchangeRateService.convertMoney(dailyProfitCny, 'CNY', displayCurrency, today);
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
      currency: displayCurrency,
      lastUpdated: new Date().toISOString(),
      allocationByCategory,
      topPerformingAssets: topPerformingAssets as unknown as Asset[],
    };
  }

  async getAllocationData(db: AppDb, userId: string, portfolioId: string, displayCurrency: string = 'CNY'): Promise<AllocationData> {
    const exchangeRateService = new ExchangeRateService(db);

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
      .where(eq(categories.portfolioId, portfolioId));

    // Calculate total value in CNY
    const { totalValueCny } = await this.calculatePortfolioMetrics(db, portfolioId);

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
        
        categoryValueCny += currentPrice * asset.quantity;
        categoryCostCny += costBasis * asset.quantity;
        categoryTotalProfitCny += (currentPrice - costBasis) * asset.quantity;
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
        
        const assetTotalProfitCny = (currentPrice - costBasis) * asset.quantity;
        const assetValueCny = currentPrice * asset.quantity;
        
        let displayAssetValue = assetValueCny;
        let displayAssetProfit = assetTotalProfitCny;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await exchangeRateService.convertMoney(assetValueCny, 'CNY', displayCurrency, today);
          displayAssetProfit = await exchangeRateService.convertMoney(assetTotalProfitCny, 'CNY', displayCurrency, today);
        }

        const assetCostCny = costBasis * asset.quantity;
        const assetYield = assetCostCny > 0 
          ? (assetTotalProfitCny / assetCostCny) * 100 
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
        
        uncategorizedValueCny += currentPrice * asset.quantity;
        uncategorizedCostCny += costBasis * asset.quantity;
        uncategorizedTotalProfitCny += (currentPrice - costBasis) * asset.quantity;
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
        
        const assetTotalProfitCny = (currentPrice - costBasis) * asset.quantity;
        const assetValueCny = currentPrice * asset.quantity;
        
        let displayAssetValue = assetValueCny;
        let displayAssetProfit = assetTotalProfitCny;
        
        if (displayCurrency !== 'CNY') {
          displayAssetValue = await exchangeRateService.convertMoney(assetValueCny, 'CNY', displayCurrency, today);
          displayAssetProfit = await exchangeRateService.convertMoney(assetTotalProfitCny, 'CNY', displayCurrency, today);
        }

        const assetCostCny = costBasis * asset.quantity;
        const assetYield = assetCostCny > 0 
          ? (assetTotalProfitCny / assetCostCny) * 100 
          : 0;

        processedAssets.push({
          id: 'uncategorized',
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

  async calculatePortfolioMetrics(db: AppDb, portfolioId: string): Promise<{
    totalValueCny: number;
    dailyProfitCny: number;
    currentTotalProfitCny: number;
    totalCostCny: number;
  }> {
    // Get all assets in the portfolio
    const assetsResult = await db
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

      totalValueCny += currentPrice * asset.quantity;
      dailyProfitCny += dailyProfit;
      totalCostCny += costBasis * asset.quantity;
      currentTotalProfitCny += (currentPrice - costBasis) * asset.quantity;
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
      const assetValueCny = currentPrice * asset.quantity;

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
    for (const [categoryId, data] of allocationByCategory) {
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
const portfolioService = new PortfolioServiceImpl();

export { portfolioService };
