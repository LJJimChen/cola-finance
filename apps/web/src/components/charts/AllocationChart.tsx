import React from 'react';
import { useI18n } from '../../lib/i18n';

interface AllocationChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  title?: string;
}

const AllocationChart: React.FC<AllocationChartProps> = ({ data, title }) => {
  const { t } = useI18n();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Generate colors for each segment
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      {/* Accessible pie chart visualization */}
      <div
        role="img"
        aria-label={title ? `${title} - Allocation chart showing ${data.length} categories` : "Allocation chart"}
        className="relative w-64 h-64 mx-auto mb-6"
      >
        <div
          className="relative w-full h-full rounded-full overflow-hidden border-2 border-border"
          aria-hidden="true"
        >
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            // Calculate rotation angles for each segment
            let startAngle = 0;
            for (let i = 0; i < index; i++) {
              startAngle += (data[i].value / total) * 360;
            }

            const angle = (item.value / total) * 360;
            const endAngle = startAngle + angle;

            // For segments larger than 180 degrees, we need to handle differently
            const isLargeArc = angle > 180 ? 1 : 0;

            // Calculate coordinates for the arc
            const startX = 50 + 50 * Math.cos((Math.PI / 180) * (startAngle - 90));
            const startY = 50 + 50 * Math.sin((Math.PI / 180) * (startAngle - 90));
            const endX = 50 + 50 * Math.cos((Math.PI / 180) * (endAngle - 90));
            const endY = 50 + 50 * Math.sin((Math.PI / 180) * (endAngle - 90));

            const pathData = [
              `M 50,50`,
              `L ${startX},${startY}`,
              `A 50,50 0 ${isLargeArc},1 ${endX},${endY}`,
              'Z'
            ].join(' ');

            return (
              <svg
                key={item.name}
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{ clipPath: `path("${pathData}")` }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="50"
                  className={`${colors[index % colors.length]} opacity-80`}
                />
              </svg>
            );
          })}
        </div>
      </div>

      {/* Accessible legend */}
      <div
        className="mt-4 space-y-2"
        role="region"
        aria-labelledby="legend-title"
      >
        <h4 id="legend-title" className="sr-only">Chart Legend</h4>
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full mr-2 ${colors[index % colors.length]}`}
              aria-label={`${item.name} color indicator`}
            ></div>
            <span className="text-sm">
              {item.name}: {item.percentage.toFixed(2)}% ({item.value.toLocaleString()})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllocationChart;