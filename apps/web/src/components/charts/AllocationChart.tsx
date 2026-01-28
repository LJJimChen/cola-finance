import React from 'react';

interface AllocationChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  title?: string;
}

const AllocationChart: React.FC<AllocationChartProps> = ({ data, title }) => {
  // Design colors
  const colors = [
    'text-primary',
    'text-sky-500',
    'text-amber-400',
    'text-purple-500',
    'text-green-500',
    'text-pink-500',
  ];
  
  const bgColors = [
    'bg-primary',
    'bg-sky-500',
    'bg-amber-400',
    'bg-purple-500',
    'bg-green-500',
    'bg-pink-500',
  ];

  // Calculate segments for stroke-dasharray approach
  // Circumference = 2 * PI * r
  // r = 15.91549430918954 (for circumference of 100)
  const r = 15.91549430918954;
  
  const offsets = data.reduce<number[]>((acc, item) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    return [...acc, previous + item.percentage];
  }, []);

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <div className="flex items-start gap-5">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
            <circle 
              className="text-gray-100 dark:text-white/5 stroke-current" 
              cx="21" 
              cy="21" 
              fill="transparent" 
              r={r} 
              strokeWidth="5"
            ></circle>
            {data.map((item, index) => {
              const dashArray = `${item.percentage} ${100 - item.percentage}`;
              const dashOffset = -(index === 0 ? 0 : offsets[index - 1]);
              
              return (
                <circle
                  key={item.name}
                  className={`${colors[index % colors.length]} stroke-current transition-all duration-300 hover:opacity-80`}
                  cx="21"
                  cy="21"
                  fill="transparent"
                  r={r}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  strokeWidth="5"
                ></circle>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rotate-90">
            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{data.length}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-3 pt-1">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-xs group cursor-pointer">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${bgColors[index % bgColors.length]} ring-2 ring-opacity-20 transition-all`}></span>
                <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[80px]">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 dark:text-white">{item.percentage.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;
