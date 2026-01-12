import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface AllocationChartProps {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
}

// Define color palette for categories
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export const AllocationChart: React.FC<AllocationChartProps> = ({ 
  currentAllocation, 
  targetAllocation 
}) => {
  // Prepare data for the chart
  const categories = Array.from(
    new Set([
      ...Object.keys(currentAllocation), 
      ...Object.keys(targetAllocation)
    ])
  );

  const chartData = categories.map(category => ({
    name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize first letter
    current: currentAllocation[category] || 0,
    target: targetAllocation[category] || 0,
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Allocation Comparison</CardTitle>
        <CardDescription>Current vs Target allocation by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]} 
                tickCount={6}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Allocation']}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Legend />
              <Bar dataKey="current" name="Current Allocation" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="target" name="Target Allocation" fill="#94a3b8" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationChart;