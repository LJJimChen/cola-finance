import React from 'react';
import { useRebalanceData } from '../hooks/useRebalanceData';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import { useDashboardData } from '../hooks/useDashboardData';

const RebalancePage: React.FC = () => {
  const { t } = useI18n();
  // Mock portfolio ID
  const portfolioId = 'portfolio-123';
  const displayCurrency = 'CNY'; // Default currency for now

  const { data: rebalanceData, isLoading: isRebalanceLoading, error: rebalanceError } = useRebalanceData({
    portfolioId,
  });

  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardData({
    portfolioId,
    displayCurrency
  });

  const isLoading = isRebalanceLoading || isDashboardLoading;
  const error = rebalanceError;

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

  // Filter recommendations
  const actionRequired = rebalanceData?.recommendations.filter((r) => Math.abs(r.deviation) > 1) ?? [];
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
                {isLoading ? <Skeleton width={120} height={32} /> : dashboardData?.totalValue?.toLocaleString(undefined, { style: 'currency', currency: displayCurrency })}
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
            <h3 className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('rebalance.actionRequired')}</h3>
            <div className="flex flex-col gap-3 px-4">
              {actionRequired.map((rec) => {
                // Parse the suggested action to extract amount if possible, or just use generic text
                // The BFF returns strings like "Sell approximately 1234 CNY..."
                // For this UI, we want to show a clean button like "Buy $6,225"
                // We'll try to parse the deviation amount.
                const deviationAmount = (Math.abs(rec.deviation) / 100) * (dashboardData?.totalValue || 0);
                const isBuy = rec.deviation < 0; // Negative deviation means underweight -> Buy
                
                return (
                  <div key={rec.categoryId} className="group flex flex-col gap-3 rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm border border-gray-100 dark:border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-10 items-center justify-center rounded-lg shrink-0 ${isBuy ? 'bg-blue-100 text-blue-700 dark:bg-primary/20 dark:text-primary' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                            {rec.categoryName.toLowerCase().includes('bond') ? 'account_balance' : 
                             rec.categoryName.toLowerCase().includes('estate') ? 'apartment' : 
                             'trending_up'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">{rec.categoryName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Current <span className="text-slate-900 dark:text-white font-mono">{rec.currentAllocation.toFixed(1)}%</span> · Target <span className="text-slate-900 dark:text-white font-mono">{(rec.targetAllocation * 100).toFixed(1)}%</span>
                          </p>
                        </div>
                      </div>
                      <button className={`flex h-9 min-w-[100px] cursor-pointer items-center justify-center rounded-lg text-sm font-bold active:scale-95 transition-all ${
                        isBuy 
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20' 
                          : 'border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-500/5'
                      }`}>
                        {isBuy ? t('rebalance.buy') : t('rebalance.sell')} {deviationAmount.toLocaleString(undefined, { style: 'currency', currency: displayCurrency, maximumFractionDigits: 0 })}
                      </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {isBuy ? (
                         // Underweight: Current is less than Target
                         <>
                           <div 
                             className="absolute left-0 top-0 h-full rounded-full bg-gray-400 dark:bg-gray-500" 
                             style={{ width: `${rec.currentAllocation}%` }}
                           ></div>
                           <div 
                             className="absolute top-0 h-full rounded-r-full bg-[#2563EB]"
                             style={{ left: `${rec.currentAllocation}%`, width: `${Math.abs(rec.deviation)}%` }}
                           ></div>
                         </>
                      ) : (
                         // Overweight: Current is more than Target
                         <>
                           <div 
                             className="absolute left-0 top-0 h-full rounded-l-full bg-gray-400 dark:bg-gray-500 z-10"
                             style={{ width: `${rec.targetAllocation * 100}%` }}
                           ></div>
                           <div 
                             className="absolute top-0 h-full rounded-r-full bg-red-400/60 dark:bg-red-500/50"
                             style={{ left: `${rec.targetAllocation * 100}%`, width: `${Math.abs(rec.deviation)}%` }}
                           ></div>
                         </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optimized Section */}
        {optimized.length > 0 && (
          <div className="flex flex-col pb-32">
            <h3 className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('rebalance.optimized')}</h3>
            <div className="flex flex-col gap-3 px-4">
              {optimized.map((rec) => (
                <div key={rec.categoryId} className="flex items-center justify-between gap-4 rounded-xl bg-card-light dark:bg-card-dark p-4 shadow-sm border border-gray-100 dark:border-white/5 opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400 shrink-0">
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                         {rec.categoryName.toLowerCase().includes('crypto') ? 'currency_bitcoin' : 
                          rec.categoryName.toLowerCase().includes('cash') ? 'attach_money' : 
                          'check_circle'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white leading-tight">{rec.categoryName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        On Target <span className="text-slate-900 dark:text-white font-mono">{rec.currentAllocation.toFixed(1)}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex h-8 px-3 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-500 text-xs font-medium border border-transparent dark:border-white/5">
                    <span className="material-symbols-outlined mr-1" style={{ fontSize: '16px' }}>check</span>
                    Hold
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulate Button */}
        <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light to-transparent dark:from-background-dark dark:via-background-dark dark:to-transparent z-40 max-w-md mx-auto pointer-events-none">
           <button className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform pointer-events-auto">
             <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>play_arrow</span>
             {t('rebalance.simulateRebalance')}
           </button>
        </div>
      </div>
    </Layout>
  );
};

export default RebalancePage;
