/**
 * Rebalance service
 *
 * Intent: Compute rebalance previews and adjustments
 * Calculates current allocation, drift, and suggested adjustments
 *
 * Contract:
 * - computeRebalancePreview: Computes current vs target allocation, drift, and adjustments
 */

import { Env } from '../types/env';
import { PortfolioService } from './portfolio.service';

export interface RebalancePreview {
  id: string;
  userId: string;
  schemeId: string;
  targetId: string;
  currentAllocation: Record<string, number>; // { category_id: percentage }
  drift: Record<string, number>; // { category_id: drift_percentage }
  adjustments: Array<{
    category: string;
    action: 'buy' | 'sell';
    amount: number;
  }>; // [{ category, action: 'buy'|'sell', amount }]
  portfolioValue: number; // Total portfolio value in display_currency
  displayCurrency: string; // ISO 4217 code
  computedAt: string; // ISO timestamp when preview was generated
}

export interface ComputeRebalancePreviewParams {
  userId: string;
  schemeId: string;
  displayCurrency: string;
}

export class RebalanceService {
  private portfolioService: PortfolioService;

  constructor(private env: Env) {
    this.portfolioService = new PortfolioService(env);
  }

  /**
   * Compute rebalance preview for a user's portfolio
   * Calculates current allocation, compares to targets, and suggests adjustments
   */
  async computeRebalancePreview(params: ComputeRebalancePreviewParams): Promise<RebalancePreview> {
    const { userId, schemeId, displayCurrency } = params;

    // Get the user's holdings in the specified currency
    const holdings = await this.portfolioService.getHoldings(userId, displayCurrency);

    // Get the classification scheme
    // In a real implementation, this would fetch from the database
    // For now, we'll use a mock implementation
    const scheme = await this.getClassificationScheme(schemeId);
    if (!scheme) {
      throw new Error(`Classification scheme not found: ${schemeId}`);
    }

    // Get the target allocation
    // In a real implementation, this would fetch from the database
    // For now, we'll use a mock implementation
    const targetAllocation = await this.getTargetAllocation(userId, schemeId);
    if (!targetAllocation) {
      throw new Error(`Target allocation not found for user ${userId} and scheme ${schemeId}`);
    }

    // Calculate current allocation by category
    const currentAllocation = await this.calculateCurrentAllocation(holdings, scheme);

    // Calculate drift (current - target)
    const drift: Record<string, number> = {};
    for (const [categoryId, targetPercentage] of Object.entries(targetAllocation.targets)) {
      const currentPercentage = currentAllocation[categoryId] || 0;
      drift[categoryId] = currentPercentage - targetPercentage;
    }

    // Calculate portfolio value
    const portfolioValue = holdings.reduce((sum, holding) => {
      return sum + parseFloat(holding.market_value);
    }, 0);

    // Calculate adjustments
    const adjustments = this.calculateAdjustments(
      currentAllocation,
      targetAllocation.targets,
      portfolioValue,
      displayCurrency
    );

    // Create the rebalance preview
    const preview: RebalancePreview = {
      id: `preview_${Date.now()}`, // In a real implementation, this would be a proper ID
      userId,
      schemeId,
      targetId: targetAllocation.id,
      currentAllocation,
      drift,
      adjustments,
      portfolioValue,
      displayCurrency,
      computedAt: new Date().toISOString(),
    };

    return preview;
  }

  /**
   * Calculate current allocation by category based on holdings
   */
  private async calculateCurrentAllocation(holdings: any[], scheme: any): Promise<Record<string, number>> {
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => {
      return sum + parseFloat(holding.market_value);
    }, 0);

    // Initialize category values
    const categoryValues: Record<string, number> = {};
    for (const category of scheme.categories) {
      categoryValues[category.id] = 0;
    }

    // Assign holdings to categories and sum values
    for (const holding of holdings) {
      // In a real implementation, we'd classify holdings based on rules or user assignment
      // For now, we'll use the holding's category if it exists, or assign to 'other'
      const category = holding.category || 'other';
      if (categoryValues.hasOwnProperty(category)) {
        categoryValues[category] += parseFloat(holding.market_value);
      } else {
        // If the holding's category isn't in the scheme, assign to 'other' or uncategorized
        categoryValues['other'] = (categoryValues['other'] || 0) + parseFloat(holding.market_value);
      }
    }

    // Convert values to percentages
    const allocation: Record<string, number> = {};
    for (const [categoryId, value] of Object.entries(categoryValues)) {
      allocation[categoryId] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    }

    return allocation;
  }

  /**
   * Calculate adjustments needed to reach target allocation
   */
  private calculateAdjustments(
    currentAllocation: Record<string, number>,
    targetAllocation: Record<string, number>,
    portfolioValue: number,
    displayCurrency: string
  ): Array<{ category: string; action: 'buy' | 'sell'; amount: number }> {
    const adjustments: Array<{ category: string; action: 'buy' | 'sell'; amount: number }> = [];

    for (const [categoryId, targetPercentage] of Object.entries(targetAllocation)) {
      const currentPercentage = currentAllocation[categoryId] || 0;
      const currentAmount = (currentPercentage / 100) * portfolioValue;
      const targetAmount = (targetPercentage / 100) * portfolioValue;
      const difference = targetAmount - currentAmount;

      if (Math.abs(difference) > 0.01) { // Ignore tiny differences due to rounding
        adjustments.push({
          category: categoryId,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference),
        });
      }
    }

    return adjustments;
  }

  /**
   * Get classification scheme by ID
   * In a real implementation, this would fetch from the database
   */
  private async getClassificationScheme(schemeId: string): Promise<any> {
    // Mock implementation - in real app, this would query the database
    console.log(`Fetching classification scheme: ${schemeId}`);
    
    // Return a mock scheme for demonstration
    return {
      id: schemeId,
      categories: [
        { id: 'stocks', name: 'Stocks' },
        { id: 'bonds', name: 'Bonds' },
        { id: 'funds', name: 'Funds' },
        { id: 'cash', name: 'Cash' },
        { id: 'crypto', name: 'Crypto' },
        { id: 'other', name: 'Other' }
      ]
    };
  }

  /**
   * Get target allocation for user and scheme
   * In a real implementation, this would fetch from the database
   */
  private async getTargetAllocation(userId: string, schemeId: string): Promise<any> {
    // Mock implementation - in real app, this would query the database
    console.log(`Fetching target allocation for user: ${userId}, scheme: ${schemeId}`);

    // Return a mock target allocation for demonstration
    return {
      id: `targets_${userId}_${schemeId}`,
      targets: {
        stocks: 60,
        bonds: 20,
        funds: 10,
        cash: 5,
        crypto: 4,
        other: 1
      }
    };
  }

  /**
   * Validate that target allocation sums to 100%
   */
  validateTargetAllocation(targets: Record<string, number>): { isValid: boolean; message?: string } {
    const total = Object.values(targets).reduce((sum, value) => sum + value, 0);

    if (Math.abs(total - 100) > 0.01) { // Allow small floating point differences
      return {
        isValid: false,
        message: `Target allocation must sum to 100%. Current sum: ${total}%`
      };
    }

    // Check for negative values
    for (const [categoryId, value] of Object.entries(targets)) {
      if (value < 0) {
        return {
          isValid: false,
          message: `Target allocation for category '${categoryId}' cannot be negative: ${value}%`
        };
      }
    }

    return { isValid: true };
  }
}