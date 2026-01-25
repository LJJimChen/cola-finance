import React from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { formatCurrency } from '../../utils/formatting';

interface PerformanceChartProps {
  data: Array<{
    date: string;
    value: number;
    formattedDate: string;
  }>;
  growth: number;
  maxDrawdown: number;
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 p-2 rounded shadow-lg text-xs">
        <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="font-bold text-slate-900 dark:text-white">
          {formatCurrency(payload[0].value, 'CNY')}
        </p>
      </div>
    );
  }
  return null;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  growth,
  maxDrawdown,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="h-[200px] w-full animate-pulse bg-gray-100 dark:bg-white/5 rounded-lg" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 gap-2">
        <span className="material-symbols-outlined text-3xl opacity-50">show_chart</span>
        <span className="text-xs">No performance data available for this period</span>
      </div>
    );
  }

  const isPositive = growth >= 0;
  const color = isPositive ? '#13ec5b' : '#ef4444'; // Green or Red

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
            Period Growth
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-extrabold tabular-nums ${
                isPositive ? 'text-slate-900 dark:text-white' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {growth > 0 ? '+' : ''}
              {growth.toFixed(1)}%
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
            Max Drawdown
          </span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            -{Math.abs(maxDrawdown).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-[200px] w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              interval="preserveStartEnd"
              minTickGap={30}
            />
            <YAxis 
              hide={true} 
              domain={['auto', 'auto']} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
