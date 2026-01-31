import type { AppDb } from '../db';
import { categories, assets, portfolios } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { fromMoney4, fromQuantity8 } from '../lib/money';
import type { 
  RebalanceRecommendations, 
  Category 
} from '@repo/shared-types';

export interface RebalancingService {
  getRebalanceRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations>;
  calculateRebalancingRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations>;
  updateCategoryTargetAllocation(userId: string, categoryId: string, targetAllocation: number): Promise<Category>;
}

export class RebalancingServiceImpl implements RebalancingService {
  constructor(private db: AppDb) {}

  async getRebalanceRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations> {
    // Verify user owns the portfolio
    const portfolioResult = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);

    if (portfolioResult.length === 0) {
      throw new Error('Portfolio not found or access denied');
    }

    return this.calculateRebalancingRecommendations(userId, portfolioId);
  }

  async calculateRebalancingRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations> {
    // Get all assets in the portfolio
    const assetsResult = await this.db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories for the user
    const categoriesResult = await this.db
      .select()
      .from(categories)
      .where(eq(categories.portfolioId, portfolioId));

    // Calculate total portfolio value
    let totalValue = 0;
    for (const asset of assetsResult) {
      totalValue += fromMoney4(asset.currentPrice4) * fromQuantity8(asset.quantity8);
    }

    // Calculate current allocation for each category
    const categoryAllocations = new Map<string, { 
      category: typeof categories.$inferSelect; 
      currentValue: number; 
      currentAllocation: number 
    }>();

    // Initialize all categories with 0 value
    for (const category of categoriesResult) {
      categoryAllocations.set(category.id, {
        category,
        currentValue: 0,
        currentAllocation: 0
      });
    }

    // Calculate value per category
    for (const asset of assetsResult) {
      if (asset.categoryId) {
        const existing = categoryAllocations.get(asset.categoryId);
        if (existing) {
          const newValue = existing.currentValue + (fromMoney4(asset.currentPrice4) * fromQuantity8(asset.quantity8));
          categoryAllocations.set(asset.categoryId, {
            ...existing,
            currentValue: newValue
          });
        }
      }
    }

    // Calculate allocation percentages
    for (const [categoryId, data] of categoryAllocations) {
      const allocation = totalValue > 0 ? (data.currentValue / totalValue) * 100 : 0;
      categoryAllocations.set(categoryId, {
        ...data,
        currentAllocation: allocation
      });
    }

    // Generate recommendations
    const recommendations = [];
    for (const data of categoryAllocations.values()) {
      const targetAllocation = data.category.targetAllocationBps / 100;
      const deviation = targetAllocation - data.currentAllocation;
      
      let recommendation = '';
      let suggestedActions: string[] = [];
      
      if (Math.abs(deviation) > 0.5) { // Only recommend if deviation is significant
        const deviationAmount = (deviation / 100) * totalValue;
        
        if (deviation > 0) {
          // Need to increase allocation
          recommendation = `Increase exposure by purchasing approximately ${Math.abs(deviationAmount).toLocaleString(undefined, { 
            style: 'currency', 
            currency: 'USD' 
          })} worth of assets in this category.`;
          suggestedActions = [`Consider purchasing assets in ${data.category.name} to reach target allocation`];
        } else {
          // Need to decrease allocation
          recommendation = `Decrease exposure by selling approximately ${Math.abs(deviationAmount).toLocaleString(undefined, { 
            style: 'currency', 
            currency: 'USD' 
          })} worth of assets in this category.`;
          suggestedActions = [`Consider selling assets in ${data.category.name} to reach target allocation`];
        }
      } else {
        recommendation = 'Allocation is within target range.';
        suggestedActions = ['No action needed at this time.'];
      }

      recommendations.push({
        categoryId: data.category.id,
        categoryName: data.category.name,
        currentAllocation: data.currentAllocation,
        targetAllocation: data.category.targetAllocationBps / 100,
        deviation,
        recommendation,
        suggestedActions
      });
    }

    return {
      portfolioId,
      recommendations
    };
  }

  async updateCategoryTargetAllocation(userId: string, categoryId: string, targetAllocation: number): Promise<Category> {
    // Verify user owns the category via portfolio
    const result = await this.db
      .select({ category: categories })
      .from(categories)
      .innerJoin(portfolios, eq(categories.portfolioId, portfolios.id))
      .where(and(eq(categories.id, categoryId), eq(portfolios.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      throw new Error('Category not found or access denied');
    }

    const [updatedCategory] = await this.db
      .update(categories)
      .set({ 
        targetAllocationBps: Math.round(targetAllocation * 100),
        updatedAt: new Date()
      })
      .where(eq(categories.id, categoryId))
      .returning();

    return {
      ...updatedCategory,
      targetAllocation: updatedCategory.targetAllocationBps / 100,
      currentAllocation: updatedCategory.currentAllocationBps / 100
    } as unknown as Category;
  }
}

// Create a singleton instance
// const rebalancingService = new RebalancingServiceImpl();

// export { rebalancingService };