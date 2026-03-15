import React, { useState, useMemo } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useHistoricalPerformance } from '../hooks/useHistoricalPerformance';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import AllocationChart from '../components/charts/AllocationChart';
import Skeleton from '../components/Skeleton';
import { Link } from '@tanstack/react-router';
import { useCurrentPortfolio } from '../hooks/useCurrentPortfolio';
import { formatCurrency } from '../utils/formatting';

import PerformanceChart from '../components/charts/PerformanceChart';

type TimeRange = '1Y' | '2Y' | '3Y' | '5Y' | 'ALL';

const DashboardPage: React.FC = () => {
  const { t } = useI18n();
  const { portfolioId, loading: portfolioLoading, error: portfolioError } = useCurrentPortfolio();

  // State for currency selection
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  // State for time range
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

  // Calculate start/end dates for historical performance
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '1Y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '2Y':
        start.setFullYear(end.getFullYear() - 2);
        break;
      case '3Y':
        start.setFullYear(end.getFullYear() - 3);
        break;
      case '5Y':
        start.setFullYear(end.getFullYear() - 5);
        break;
      case 'ALL':
        start.setFullYear(end.getFullYear() - 20); // Fallback for ALL
        break;
    }
    return { startDate: start, endDate: end };
  }, [timeRange]);

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData({
    portfolioId: portfolioId || '',
    displayCurrency
  });

  const { data: historicalData, isLoading: historyLoading } = useHistoricalPerformance({
    portfolioId: portfolioId || '',
    startDate,
    endDate,
    displayCurrency
  });

  const isLoading = portfolioLoading || dashboardLoading;
  const error = portfolioError || dashboardError;

  // Process historical data for chart
  const chartData = useMemo(() => {
    if (!historicalData?.snapshots || historicalData.snapshots.length === 0) return null;

    const snapshots = historicalData.snapshots;
    const values = snapshots.map(s => s.totalValue);
    
    // Calculate metrics
    const startVal = values[0];
    const endVal = values[values.length - 1];
    const growth = ((endVal - startVal) / startVal) * 100;

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = values[0];
    for (const val of values) {
      if (val > peak) peak = val;
      const drawdown = (peak - val) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Format data for Recharts
    const data = snapshots.map(s => ({
      date: s.date instanceof Date ? s.date.toISOString() : s.date,
      value: s.totalValue
    }));

    return {
      data,
      growth,
      maxDrawdown: maxDrawdown * 100,
    };
  }, [historicalData]);



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

  // Calculate percentages for the chart
  const allocationData = dashboardData?.allocationByCategory?.map(cat => ({
    name: cat.categoryName,
    value: cat.value,
    percentage: cat.percentage
  })) || [];

  return (
    <Layout>
      <div className="flex flex-col pt-6 pb-2">
        {/* Total Net Asset Value */}
        <div className="flex flex-col mb-1">
          <span className="text-gray-500 dark:text-[#92c9a4] text-xs font-bold uppercase tracking-wider mb-1">
            {t('dashboard.totalValue')}
          </span>
          <h1 className="text-[40px] leading-none font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {isLoading ? <Skeleton width={200} height={40} /> : formatCurrency(dashboardData?.totalValue || 0, displayCurrency)}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-1 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
              <span className="material-symbols-outlined text-[16px]">currency_exchange</span>
              <span className="tabular-nums">
                ≈ {isLoading ? '...' : formatCurrency(dashboardData?.totalValue || 0, displayCurrency === 'USD' ? 'EUR' : 'USD')}
              </span>
            </p>
            {/* Currency selector - Temporary UI for MVP */}
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="text-xs bg-transparent border border-gray-200 dark:border-white/10 rounded px-1 text-gray-500"
              disabled={isLoading}
            >
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {/* Daily Gain */}
          <div className="bg-surface-light dark:bg-surface-dark p-3.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-green-500">show_chart</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('dashboard.dailyProfit')}</span>
            <div className={`flex items-baseline gap-1.5 ${dashboardData?.dailyProfit && dashboardData.dailyProfit >= 0 ? 'text-green-600 dark:text-[#13ec5b]' : 'text-red-600 dark:text-red-400'}`}>
              <span className="text-lg font-bold tabular-nums">
                {isLoading ? <Skeleton width={60} height={24} /> : (dashboardData?.dailyProfit && dashboardData.dailyProfit > 0 ? '+' : '') + formatCurrency(dashboardData?.dailyProfit || 0, displayCurrency)}
              </span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded tabular-nums ${dashboardData?.dailyProfit && dashboardData.dailyProfit >= 0 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                {dashboardData?.dailyProfit && dashboardData.totalValue ? ((dashboardData.dailyProfit / dashboardData.totalValue) * 100).toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>

          <div className="bg-surface-light dark:bg-surface-dark p-3.5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-blue-500">calendar_month</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('dashboard.totalProfit')}</span>
            <div className={`flex items-baseline gap-1.5 ${dashboardData?.totalProfit && dashboardData.totalProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              <span className="text-lg font-bold tabular-nums">
                {isLoading ? <Skeleton width={80} height={24} /> : (dashboardData?.totalProfit && dashboardData.totalProfit > 0 ? '+' : '') + formatCurrency(dashboardData?.totalProfit || 0, displayCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Performance Chart */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-slate-900 dark:text-white font-bold text-base">Overall Performance</h2>
            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
              {(['1Y', '2Y', '3Y', '5Y', 'ALL'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`h-6 px-2.5 text-[10px] leading-none font-medium transition-all rounded shadow-sm
                    ${timeRange === range
                      ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white font-bold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden min-h-[286px]">
               <PerformanceChart
                  data={chartData?.data || []}
                  growth={chartData?.growth || 0}
                  maxDrawdown={chartData?.maxDrawdown || 0}
                  isLoading={historyLoading}
               />
            </div>
        </div>

        {/* Allocation Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-slate-900 dark:text-white font-bold text-base">{t('dashboard.allocationChart')}</h2>
            <Link to="/portfolio" className="text-xs text-primary font-medium hover:underline cursor-pointer">View Details</Link>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-white/5 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            {isLoading ? (
              <div className="h-32 flex items-center justify-center">
                <Skeleton width="100%" height="100%" />
              </div>
            ) : (
              <AllocationChart data={allocationData} />
            )}
            
            <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-white/5 flex justify-center">
                <Link to="/rebalance" className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[14px]">scale</span>
                    Rebalance Suggestions Available
                </Link>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <p className="text-gray-400/60 text-[10px] flex items-center justify-center gap-1 mt-8 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
          Last sync: Just now
        </p>

        {/* Encryption Status */}
        <div className="mt-auto mb-4 flex items-center justify-center gap-2 text-gray-400 opacity-60">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{t('auth.localEncryption')}</span>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
