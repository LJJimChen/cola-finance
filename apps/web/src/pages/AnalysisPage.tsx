import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';
import { useHistoricalPerformance } from '../hooks/useHistoricalPerformance';
import Skeleton from '../components/Skeleton';
import { useCurrentPortfolio } from '../hooks/useCurrentPortfolio';
import { formatCurrency } from '../utils/formatting';

const AnalysisPage: React.FC = () => {
  const { t } = useI18n();
  const { portfolioId, loading: portfolioLoading, error: portfolioError } = useCurrentPortfolio();

  const [displayCurrency] = useState('CNY');
  
  // Date range logic
  const [range, setRange] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y' | 'All'>('1Y');
  
  const getDates = (r: typeof range) => {
    const end = new Date();
    const start = new Date();
    if (r === '1M') start.setMonth(end.getMonth() - 1);
    else if (r === '3M') start.setMonth(end.getMonth() - 3);
    else if (r === '6M') start.setMonth(end.getMonth() - 6);
    else if (r === '1Y') start.setFullYear(end.getFullYear() - 1);
    else if (r === '3Y') start.setFullYear(end.getFullYear() - 3);
    else start.setFullYear(end.getFullYear() - 10); // All = 10Y for now
    return { startDate: start, endDate: end };
  };

  const { startDate, endDate } = getDates(range);

  const { data: history, isLoading: historyLoading, error: historyError } = useHistoricalPerformance({
    portfolioId: portfolioId || '',
    startDate,
    endDate,
    displayCurrency
  });

  const isLoading = portfolioLoading || historyLoading;
  const error = portfolioError || historyError;

  // Handle 401 Unauthorized errors by rendering nothing (while redirect happens)
  if (error && 'response' in error && (error as { response?: { status: number } }).response?.status === 401) {
    return null;
  }

  // Chart SVG Generation
  const generateChartPath = (width: number, height: number) => {
    if (!history?.snapshots || history.snapshots.length === 0) return '';

    const data = history.snapshots;
    const minVal = Math.min(...data.map(d => d.totalValue));
    const maxVal = Math.max(...data.map(d => d.totalValue));
    const valRange = maxVal - minVal;
    
    // Add some padding to range
    const paddedMin = minVal - valRange * 0.1;
    const paddedMax = maxVal + valRange * 0.1;
    const paddedRange = paddedMax - paddedMin;

    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d.totalValue - paddedMin) / paddedRange) * height;
      return `${x},${y}`;
    });

    // Create curved line (Catmull-Rom or simple Bezier)
    // For simplicity, we'll use straight lines or basic smooth curve approximation
    // Let's do a simple smooth curve using cubic bezier
    let path = `M ${points[0]}`;
    for (let i = 1; i < points.length; i++) {
        // Simple smoothing
        const [currX, currY] = points[i].split(',').map(Number);
        const [prevX, prevY] = points[i-1].split(',').map(Number);
        const cp1x = prevX + (currX - prevX) / 2;
        const cp1y = prevY;
        const cp2x = prevX + (currX - prevX) / 2;
        const cp2y = currY;
        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
    }
    
    return path;
  };

  const generateAreaPath = (linePath: string, width: number, height: number) => {
      if (!linePath) return '';
      // Close the path to create area
      return `${linePath} L ${width},${height} L 0,${height} Z`;
  };

  const latestSnapshot = history?.snapshots[history.snapshots.length - 1];
  const previousSnapshot = history?.snapshots[0]; // Start of period
  
  const growth = latestSnapshot && previousSnapshot 
    ? latestSnapshot.totalValue - previousSnapshot.totalValue 
    : 0;
  
  const growthPercent = latestSnapshot && previousSnapshot && previousSnapshot.totalValue > 0
    ? (growth / previousSnapshot.totalValue) * 100
    : 0;

  const chartWidth = 350;
  const chartHeight = 220;
  const linePath = generateChartPath(chartWidth, chartHeight);
  const areaPath = generateAreaPath(linePath, chartWidth, chartHeight);

  if (error) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{t('common.error')}: {(error as Error).message}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative flex h-full w-full flex-col max-w-md mx-auto overflow-x-hidden min-h-screen pb-6">
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md">
          <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Performance</h2>
          <div className="flex items-center justify-end w-10">
             {/* Avatar placeholders */}
             <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-surface-dark border-2 border-background-light dark:border-background-dark flex items-center justify-center text-xs">A</div>
             </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col px-4 pt-2">
          {/* Hero Stats */}
          <div className="flex flex-col items-center justify-center pt-2 pb-6">
            <h1 className="text-4xl font-bold tracking-tighter tabular-nums">
              {isLoading ? <Skeleton width={200} height={40} /> : latestSnapshot?.totalValue?.toLocaleString(undefined, { style: 'currency', currency: displayCurrency })}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className={`material-symbols-outlined text-xl ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              <h2 className={`text-base font-semibold leading-tight tracking-tight ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {isLoading ? <Skeleton width={100} height={20} /> : `${growth >= 0 ? '+' : ''}${formatCurrency(growth, displayCurrency)} (${growthPercent.toFixed(1)}%)`}
              </h2>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex w-full mb-4">
            <div className="flex h-10 w-full items-center rounded-lg bg-gray-200 dark:bg-surface-dark p-1 relative">
              <label className="z-10 flex-1 cursor-pointer flex items-center justify-center h-full rounded-[6px] transition-all bg-white dark:bg-[#1e3b2a] shadow-sm text-black dark:text-primary text-xs font-semibold">
                <span className="truncate">Total Asset Growth</span>
                <input defaultChecked className="hidden" name="metric-toggle" type="radio" value="growth"/>
              </label>
              <label className="z-10 flex-1 cursor-pointer flex items-center justify-center h-full rounded-[6px] transition-all text-gray-500 dark:text-gray-400 text-xs font-semibold">
                <span className="truncate">Cumulative Returns</span>
                <input className="hidden" name="metric-toggle" type="radio" value="returns"/>
              </label>
            </div>
          </div>

          {/* Chart */}
          <div className="relative w-full h-[260px] mb-6 select-none group cursor-crosshair">
             {isLoading ? (
               <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-white/5 rounded-xl">
                 <Skeleton width="100%" height="100%" />
               </div>
             ) : (
               <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                 <defs>
                   <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                     <stop offset="0%" style={{ stopColor: '#13ec5b', stopOpacity: 0.25 }} />
                     <stop offset="100%" style={{ stopColor: '#13ec5b', stopOpacity: 0 }} />
                   </linearGradient>
                 </defs>
                 {/* Grid lines */}
                 <g className="text-gray-200 dark:text-white/10">
                   <line stroke="currentColor" strokeDasharray="2 2" x1="0" x2={chartWidth} y1={chartHeight * 0.25} y2={chartHeight * 0.25}></line>
                   <line stroke="currentColor" strokeDasharray="2 2" x1="0" x2={chartWidth} y1={chartHeight * 0.5} y2={chartHeight * 0.5}></line>
                   <line stroke="currentColor" strokeDasharray="2 2" x1="0" x2={chartWidth} y1={chartHeight * 0.75} y2={chartHeight * 0.75}></line>
                   <line stroke="currentColor" strokeDasharray="2 2" x1="0" x2={chartWidth} y1={chartHeight} y2={chartHeight}></line>
                 </g>
                 {/* Area */}
                 <path d={areaPath} fill="url(#gradient)" stroke="none" />
                 {/* Line */}
                 <path d={linePath} fill="none" stroke="#13ec5b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
               </svg>
             )}
          </div>

          {/* Time Range Selector */}
          <div className="flex justify-between items-center mb-8 px-1">
            <div className="flex flex-1 justify-between gap-1 overflow-x-auto hide-scrollbar">
              {(['1M', '3M', '6M', '1Y', '3Y', 'All'] as const).map((r) => (
                <button 
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    range === r 
                      ? 'text-black dark:text-primary bg-white dark:bg-[#1e3b2a] shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-lg">percent</span>
                <span className="text-xs font-medium uppercase tracking-wider">{t('dashboard.annualReturn')}</span>
              </div>
              <p className="text-xl font-bold text-black dark:text-white">
                {isLoading ? <Skeleton width={60} height={24} /> : `${history?.totalReturn?.toFixed(1)}%`}
              </p>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-lg">water_loss</span>
                <span className="text-xs font-medium uppercase tracking-wider">Volatility</span>
              </div>
              <p className="text-xl font-bold text-black dark:text-white">
                {isLoading ? <Skeleton width={60} height={24} /> : `${history?.volatility?.toFixed(1)}%`}
              </p>
            </div>
          </div>

          {/* Breakdown List (Simplified for now) */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden mb-8">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
              <h3 className="font-semibold text-sm">Portfolio Breakdown</h3>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold border border-primary/20">YTD</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
               {/* Mock items to match design structure */}
               <div className="flex justify-between items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                     <span className="material-symbols-outlined text-lg block">account_balance_wallet</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-medium">Beginning Balance</span>
                     <span className="text-[10px] text-gray-400 dark:text-gray-500">{startDate.toLocaleDateString()}</span>
                   </div>
                 </div>
                 <span className="text-sm font-semibold tabular-nums">
                   {isLoading ? <Skeleton width={80} height={20} /> : formatCurrency(previousSnapshot?.totalValue || 0, displayCurrency)}
                 </span>
               </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default AnalysisPage;
