import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface AllocationChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  title?: string;
}

const AllocationChart: React.FC<AllocationChartProps> = ({ data, title }) => {
  const bgColors = [
    'bg-primary',
    'bg-sky-500',
    'bg-amber-400',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
  ];

  const sliceColors = [
    'var(--color-primary)',
    '#0ea5e9',
    '#f59e0b',
    '#a855f7',
    '#22c55e',
    '#ec4899',
  ];

  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-400">
        No allocation data
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <div className="flex items-start gap-5">
        <div className="relative w-32 h-32 shrink-0">
          <div className="w-full h-full focus:outline-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="percentage"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={58}
                  paddingAngle={2}
                  animationDuration={800}
                  animationBegin={0}
                  isAnimationActive={true}
                  style={{ outline: 'none' }}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={sliceColors[index % sliceColors.length]}
                      stroke="none"
                      style={{ outline: 'none' }}
                      className="focus:outline-none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {data.length}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-1 pt-1">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="w-full flex items-center justify-between text-xs px-2 py-1.5 rounded-md"
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${bgColors[index % bgColors.length]}`}
                ></span>
                <span
                  className="font-medium truncate max-w-[80px] text-gray-600 dark:text-gray-300"
                >
                  {item.name}
                </span>
              </span>
              <span className="text-right">
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  {item.percentage.toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;
