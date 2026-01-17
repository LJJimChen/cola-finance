import { db } from '../db';
import { assets, categories, portfolios } from '../db/schema';
import { eq, and, desc, sum } from 'drizzle-orm';
import type { 
  RebalanceRecommendations, 
  CreateCategoryRequest, 
  UpdateCategoryRequest,
  Category 
} from '@repo/shared-types';

export interface RebalancingService {
  getRebalanceRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations>;
  calculateRebalancingRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations>;
  updateCategoryTargetAllocation(userId: string, categoryId: string, targetAllocation: number): Promise<Category>;
}

export class RebalancingServiceImpl implements RebalancingService {
  async getRebalanceRecommendations(userId: string, portfolioId: string): Promise<RebalanceRecommendations> {
    // Verify user owns the portfolio
    const portfolioResult = await db
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
    const assetsResult = await db
      .select()
      .from(assets)
      .where(eq(assets.portfolioId, portfolioId));

    // Get all categories for the user
    const categoriesResult = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Calculate total portfolio value
    let totalValue = 0;
    for (const asset of assetsResult) {
      totalValue += asset.currentPrice * asset.quantity;
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
          const newValue = existing.currentValue + (asset.currentPrice * asset.quantity);
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
    for (const [categoryId, data] of categoryAllocations) {
      const deviation = data.category.targetAllocation - data.currentAllocation;
      
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
        targetAllocation: data.category.targetAllocation,
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
    // Verify user owns the category
    const categoryResult = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .limit(1);

    if (categoryResult.length === 0) {
      throw new Error('Category not found or access denied');
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({ 
        targetAllocation,
        updatedAt: new Date().toISOString()
      })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning();

    return updatedCategory as unknown as Category;
  }
}

// Create a singleton instance
const rebalancingService = new RebalancingServiceImpl();

export { rebalancingService };