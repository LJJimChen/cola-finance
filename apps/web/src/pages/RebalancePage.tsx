import React from 'react';
import { useRebalanceData } from '../hooks/useRebalanceData';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCurrentPortfolio } from '../hooks/useCurrentPortfolio';
import { formatCurrency } from '../utils/formatting';

const RebalancePage: React.FC = () => {
  const { t } = useI18n();
  const { portfolioId, loading: portfolioLoading, error: portfolioError } = useCurrentPortfolio();
 
  const displayCurrency = 'CNY'; // Default currency for now

  const { data: rebalanceData, isLoading: isRebalanceLoading, error: rebalanceError } = useRebalanceData({
    portfolioId: portfolioId || '',
  });

  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData({
    portfolioId: portfolioId || '',
    displayCurrency
  });

  const isLoading = isRebalanceLoading || isDashboardLoading || portfolioLoading;
  const error = rebalanceError || dashboardError || portfolioError;

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

  // Calculate Drift Score (mock logic for now as it's not in API yet, or sum of deviations)
  // Simple drift score: sum of absolute deviations / 2
  const driftScore = rebalanceData?.recommendations
    ? rebalanceData.recommendations.reduce((acc, rec) => acc + Math.abs(rec.deviation), 0) / 2
    : 0;

  const isDriftHigh = driftScore > 5;

  // Filter and sort recommendations
  const actionRequired = (rebalanceData?.recommendations.filter((r) => Math.abs(r.deviation) > 1) ?? []).sort((a, b) => {
    const isASell = a.deviation > 0;
    const isBSell = b.deviation > 0;
    // 1. Sell first (deviation > 0)
    if (isASell && !isBSell) return -1;
    if (!isASell && isBSell) return 1;
    // 2. Sort by Amount (absolute deviation) descending
    return Math.abs(b.deviation) - Math.abs(a.deviation);
  });
  const optimized = rebalanceData?.recommendations.filter((r) => Math.abs(r.deviation) <= 1) ?? [];

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between py-4 pb-2 border-b border-gray-200 dark:border-white/5 mb-4">
          <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">{t('common.rebalance')}</h2>
          <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white" style={{ fontSize: '24px' }}>visibility</span>
          </button>
        </header>

        {/* Summary Cards */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-3">
            {/* Total Value Card */}
            <div className="flex flex-1 flex-col gap-3 rounded-xl p-5 bg-card-light dark:bg-card-dark shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500" style={{ fontSize: '20px' }}>account_balance_wallet</span>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalValue')}</p>
              </div>
              <p className="text-2xl font-bold tracking-tight font-mono tabular-nums">
                {isLoading ? <Skeleton width={120} height={32} /> : formatCurrency(dashboardData?.totalValue || 0, displayCurrency)}
              </p>
            </div>

            {/* Drift Score Card */}
            <div className="flex flex-1 flex-col gap-3 rounded-xl p-5 bg-card-light dark:bg-card-dark shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110 ${isDriftHigh ? 'bg-red-500/10' : 'bg-green-500/10'}`}></div>
              <div className="flex items-center gap-2 relative z-10">
                <span className={`material-symbols-outlined ${isDriftHigh ? 'text-red-500' : 'text-green-500'}`} style={{ fontSize: '20px' }}>
                  {isDriftHigh ? 'warning' : 'check_circle'}
                </span>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('rebalance.driftScore')}</p>
              </div>
              <div className="flex items-end gap-2 relative z-10">
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums">
                  {isLoading ? <Skeleton width={60} height={32} /> : `${driftScore.toFixed(1)}%`}
                </p>
                <p className={`text-sm font-medium mb-1 ${isDriftHigh ? 'text-red-500' : 'text-green-500'}`}>
                  {isLoading ? null : (isDriftHigh ? 'High' : 'Low')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {isLoading ? <Skeleton width="100%" height={20} /> : 
                (isDriftHigh 
                  ? t('rebalance.driftHighMessage')
                  : t('rebalance.driftLowMessage'))
              }
            </p>
          </div>
        </div>

        {/* Action Required Section */}
        {actionRequired.length > 0 && (
          <div className="flex flex-col pb-4">
            <h3 className="px-1 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('rebalance.actionRequired')}</h3>
            <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/5 bg-card-light dark:bg-card-dark shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
                    <th className="py-2 pl-3 font-medium">Asset Class</th>
                    <th className="py-2 text-right font-medium">Current (%)</th>
                    <th className="py-2 text-right font-medium">Target (%)</th>
                    <th className="py-2 pr-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {actionRequired.map((rec) => {
                    // Parse the suggested action to extract amount if possible, or just use generic text
                    // The BFF returns strings like "Sell approximately 1234 CNY..."
                    // For this UI, we want to show a clean button like "Buy $6,225"
                    // We'll try to parse the deviation amount.
                    const deviationAmount = (Math.abs(rec.deviation) / 100) * (dashboardData?.totalValue || 0);
                    const isBuy = rec.deviation < 0; // Negative deviation means underweight -> Buy
                    
                    return (
                      <tr key={rec.categoryId} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2 pl-3">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">{rec.categoryName}</span>
                        </td>
                        <td className="py-2 text-right font-mono text-sm text-slate-900 dark:text-white">
                          {rec.currentAllocation.toFixed(1)}
                        </td>
                        <td className="py-2 text-right font-mono text-sm text-slate-900 dark:text-white">
                          {rec.targetAllocation.toFixed(1)}
                        </td>
                        <td className="py-2 pr-3 text-right">
                           <div className={`flex items-center justify-end gap-1 font-mono text-sm font-bold ${isBuy ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                             <span>{formatCurrency(deviationAmount, displayCurrency)}</span>
                             <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                               {isBuy ? 'arrow_upward' : 'arrow_downward'}
                             </span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Optimized Section */}
        {optimized.length > 0 && (
          <div className="flex flex-col pb-32">
            <h3 className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('rebalance.optimized')}</h3>
            <div className="mx-4 overflow-hidden rounded-xl border border-gray-100 dark:border-white/5 bg-card-light dark:bg-card-dark shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-xs text-gray-500 dark:text-gray-400">
                    <th className="py-2 pl-3 font-medium">Asset Class</th>
                    <th className="py-2 text-right font-medium">Current (%)</th>
                    <th className="py-2 text-right font-medium">Target (%)</th>
                    <th className="py-2 pr-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {optimized.map((rec) => (
                    <tr key={rec.categoryId} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors opacity-80">
                      <td className="py-2 pl-3">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{rec.categoryName}</span>
                      </td>
                      <td className="py-2 text-right font-mono text-sm text-slate-900 dark:text-white">
                        {rec.currentAllocation.toFixed(1)}
                      </td>
                      <td className="py-2 text-right font-mono text-sm text-slate-900 dark:text-white">
                        {rec.targetAllocation.toFixed(1)}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <div className="inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 px-2 py-1 text-xs font-medium">
                          <span className="material-symbols-outlined mr-1" style={{ fontSize: '14px' }}>check</span>
                          Hold
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Simulate Button Removed as requested */}
      </div>
    </Layout>
  );
};

export default RebalancePage;
