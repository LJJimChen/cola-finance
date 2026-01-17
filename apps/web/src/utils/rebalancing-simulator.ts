import type { Asset, Category } from '@repo/shared-types';

export interface SimulationResult {
  category: Category;
  currentAllocation: number;
  targetAllocation: number;
  simulatedAllocation: number;
  difference: number;
  suggestedActions: string[];
}

export interface RebalancingSimulation {
  simulateRebalancing(
    assets: Asset[], 
    categories: Category[], 
    targetChanges: { categoryId: string; newTarget: number }[]
  ): SimulationResult[];
}

export class RebalancingSimulator implements RebalancingSimulation {
  simulateRebalancing(
    assets: Asset[], 
    categories: Category[], 
    targetChanges: { categoryId: string; newTarget: number }[]
  ): SimulationResult[] {
    // Calculate current total portfolio value
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentPrice * asset.quantity), 0);
    
    if (totalValue === 0) {
      return categories.map(category => ({
        category,
        currentAllocation: 0,
        targetAllocation: category.targetAllocation,
        simulatedAllocation: 0,
        difference: category.targetAllocation,
        suggestedActions: ['Portfolio value is zero, no rebalancing possible']
      }));
    }

    // Calculate current allocations by category
    const currentAllocations = new Map<string, number>();
    for (const asset of assets) {
      if (asset.categoryId) {
        const currentValue = (asset.currentPrice * asset.quantity);
        const existingValue = currentAllocations.get(asset.categoryId) || 0;
        currentAllocations.set(asset.categoryId, existingValue + currentValue);
      }
    }

    // Convert to percentages
    const currentPercentages = new Map<string, number>();
    for (const [categoryId, value] of currentAllocations) {
      currentPercentages.set(categoryId, (value / totalValue) * 100);
    }

    // Apply target changes to a copy of categories
    const updatedCategories = categories.map(cat => {
      const change = targetChanges.find(c => c.categoryId === cat.id);
      return {
        ...cat,
        targetAllocation: change ? change.newTarget : cat.targetAllocation
      };
    });

    // Calculate simulation results
    const results: SimulationResult[] = [];
    
    for (const category of updatedCategories) {
      const currentAllocation = currentPercentages.get(category.id) || 0;
      const targetAllocation = category.targetAllocation;
      
      // For simulation, we'll calculate what the allocation would be after rebalancing
      // This is a simplified model - in reality, rebalancing involves buying/selling assets
      const simulatedAllocation = targetAllocation; // In a perfect world after rebalancing
      const difference = targetAllocation - currentAllocation;
      
      // Generate suggested actions
      const suggestedActions: string[] = [];
      
      if (Math.abs(difference) > 0.5) { // Only suggest if deviation is significant
        const deviationAmount = (difference / 100) * totalValue;
        
        if (difference > 0) {
          // Need to increase allocation
          suggestedActions.push(
            `To reach target, increase allocation by ${Math.abs(deviationAmount).toLocaleString(undefined, { 
              style: 'currency', 
              currency: 'USD' 
            })}`
          );
          suggestedActions.push(`Consider purchasing assets in ${category.name}`);
        } else {
          // Need to decrease allocation
          suggestedActions.push(
            `To reach target, decrease allocation by ${Math.abs(deviationAmount).toLocaleString(undefined, { 
              style: 'currency', 
              currency: 'USD' 
            })}`
          );
          suggestedActions.push(`Consider selling assets in ${category.name}`);
        }
      } else {
        suggestedActions.push('Allocation is within target range.');
      }

      results.push({
        category,
        currentAllocation,
        targetAllocation,
        simulatedAllocation,
        difference,
        suggestedActions
      });
    }

    return results;
  }
}

// Create a singleton instance
const rebalancingSimulator = new RebalancingSimulator();

export { rebalancingSimulator };