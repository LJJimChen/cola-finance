import React, { useState } from 'react';
import { useAllocationData } from '../hooks/useAllocationData';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import { useCurrentPortfolio } from '../hooks/useCurrentPortfolio';

const PortfolioPage: React.FC = () => {
  const { t } = useI18n();
  const { portfolioId, loading: portfolioLoading, error: portfolioError } = useCurrentPortfolio();
 
  const [displayCurrency] = useState('USD');
  const [isEditingTargets, setIsEditingTargets] = useState(false);

  const { data: allocationData, isLoading: allocationLoading, error: allocationError } = useAllocationData({
    portfolioId: portfolioId || '',
    displayCurrency
  });

  const isLoading = portfolioLoading || allocationLoading;
  const error = portfolioError || allocationError;

  // Handle 401 Unauthorized errors by rendering nothing (while redirect happens)
  if (error && 'response' in error && (error as { response?: { status: number } }).response?.status === 401) {
    return null;
  }

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{t('common.error')}: {(error as Error).message}</p>
        </div>
      </Layout>
    );
  }

  // Calculate total net worth from categories if not available directly
  const totalNetWorth = allocationData?.totalValue || 0;
  // Mock trend percentage for now
  const trendPercentage = 2.4;

  const getCategoryColor = (index: number) => {
    const colors = ['bg-[#13ec5b]', 'bg-[#0ea5e9]', 'bg-[#f59e0b]', 'bg-[#a855f7]', 'bg-pink-500'];
    return colors[index % colors.length];
  };

  const getCategoryTextColor = (index: number) => {
    const colors = ['text-[#13ec5b]', 'text-[#0ea5e9]', 'text-[#f59e0b]', 'text-[#a855f7]', 'text-pink-500'];
    return colors[index % colors.length];
  };

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">Portfolio</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Hide sensitive values" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300">visibility</span>
            </button>
            <button 
              onClick={() => setIsEditingTargets(!isEditingTargets)}
              className={`font-semibold text-sm px-3 py-1.5 rounded-full transition-colors border ${isEditingTargets ? 'bg-primary text-white border-primary' : 'text-primary border-transparent hover:bg-primary/10 hover:border-primary/20'}`}
            >
              {isEditingTargets ? 'Done' : 'Edit Targets'}
            </button>
          </div>
        </div>

        {isEditingTargets && allocationData ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-4 animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Manage Categories</h3>
             </div>
             {/* Simple list for editing targets */}
             <div className="space-y-4">
               {allocationData.categories.map(cat => (
                 <div key={cat.id} className="flex items-center justify-between gap-2">
                   <span className="text-sm font-medium">{cat.name}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-gray-500">Target:</span>
                     <div className="relative w-20">
                       <input 
                         type="number" 
                         defaultValue={cat.targetAllocation}
                         className="w-full px-2 py-1 text-right text-sm border rounded bg-transparent"
                         // In a real app, onBlur or onChange would call API to update
                       />
                       <span className="absolute right-6 top-1 text-xs">%</span>
                     </div>
                   </div>
                 </div>
               ))}
               <p className="text-xs text-gray-400 mt-2 text-center">
                 Updates are auto-saved (Mock)
               </p>
             </div>
          </div>
        ) : null}

        {/* Total Net Worth Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/5 shadow-sm p-5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Personal Portfolio</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Net Worth</span>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? <Skeleton width={120} height={32} /> : totalNetWorth.toLocaleString(undefined, { style: 'currency', currency: displayCurrency })}
              </h2>
              <div className="flex items-center justify-end gap-1 text-primary text-xs font-medium">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+{trendPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Allocation Bar */}
          <div className="w-full h-4 flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mt-4 mb-4">
            {isLoading ? (
              <Skeleton width="100%" height="100%" />
            ) : (
              allocationData?.categories.map((category, index) => (
                <div 
                  key={category.id} 
                  className={`h-full ${getCategoryColor(index)}`} 
                  style={{ width: `${category.currentAllocation}%` }}
                  title={`${category.name}: ${category.currentAllocation.toFixed(1)}%`}
                />
              ))
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-y-2 px-1">
            {allocationData?.categories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(index)}`}></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{category.name} {category.currentAllocation.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Allocation Details Header */}
        <div className="flex items-center justify-between px-2 pt-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Allocation Details</h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 bg-gray-600 dark:bg-gray-400 rounded-full opacity-30"></div>
              <span className="text-gray-500">Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-3 bg-primary rounded-full"></div>
              <span className="text-gray-500">Actual</span>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="grid gap-4 pb-20">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} width="100%" height={100} />)}
            </div>
          ) : (
            allocationData?.categories.map((category, index) => {
              const deviation = category.currentAllocation - category.targetAllocation;
              const isOverweight = deviation > 0.5;
              const deviationText = Math.abs(deviation) < 0.5 ? 'On Target' : `${isOverweight ? 'Overweight' : 'Underweight'} (${deviation > 0 ? '+' : ''}${deviation.toFixed(0)}%)`;
              const deviationColorClass = Math.abs(deviation) < 0.5 ? 'text-primary' : (isOverweight ? 'text-amber-500' : 'text-rose-500');

              return (
                <div key={category.id} className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-primary/30 transition-all cursor-pointer group overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getCategoryColor(index)}/10 flex items-center justify-center ${getCategoryTextColor(index)}`}>
                          <span className="material-symbols-outlined">
                            {category.name.toLowerCase().includes('equities') || category.name.toLowerCase().includes('stock') ? 'query_stats' : 
                             category.name.toLowerCase().includes('bond') ? 'account_balance' : 
                             category.name.toLowerCase().includes('cash') ? 'savings' : 
                             category.name.toLowerCase().includes('crypto') ? 'currency_bitcoin' : 'category'}
                          </span>
                        </div>
                        <div>
                          <h3 className={`font-bold text-gray-900 dark:text-white group-hover:${getCategoryTextColor(index)} transition-colors`}>{category.name}</h3>
                          <div className={`text-xs ${deviationColorClass} font-medium mt-0.5`}>{deviationText}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          {formatCurrency(category.value, displayCurrency)}
                        </div>
                        <span className="text-xs text-gray-400">{category.currentAllocation.toFixed(0)}% of Portfolio</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-white z-10 opacity-60" style={{ left: `${category.targetAllocation}%` }}></div>
                      <div className={`h-full ${getCategoryColor(index)} rounded-full`} style={{ width: `${category.currentAllocation}%` }}></div>
                    </div>
                    
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                      <span>Actual: {category.currentAllocation.toFixed(0)}%</span>
                      <span>Target: {category.targetAllocation.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Assets List (Holdings) */}
                  {category.assets && category.assets.length > 0 && (
                    <div className="bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                      <div className="px-4 py-2 flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Holdings</span>
                        <span className="text-[10px] text-gray-400">{category.assets.length} Assets</span>
                      </div>
                      {category.assets.map(asset => (
                        <div key={asset.id} className="px-4 py-3 border-t border-gray-100 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                              {asset.symbol.substring(0, 4)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{asset.symbol}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-bold text-gray-900 dark:text-white">
                              {formatCurrency(asset.value, displayCurrency)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {(allocationData.totalValue > 0 ? (asset.value / allocationData.totalValue * 100) : 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioPage;