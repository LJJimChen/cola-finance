import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioSummaryProps {
  totalValue?: number;
  todaysReturn?: number;
  todaysReturnPercent?: number;
  lastUpdated?: string;
  displayCurrency?: string;
  isLoading?: boolean;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  todaysReturn,
  todaysReturnPercent,
  lastUpdated,
  displayCurrency = 'USD',
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Portfolio Value</CardDescription>
          <Skeleton className="h-8 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>Portfolio Value</CardDescription>
        <CardTitle className="text-2xl">
          {displayCurrency} {totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className={`text-sm ${todaysReturn && todaysReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {todaysReturn !== undefined && todaysReturnPercent !== undefined ? (
              <>
                <span>{todaysReturn >= 0 ? '+' : ''}{displayCurrency} {Math.abs(todaysReturn).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span> ({todaysReturnPercent >= 0 ? '+' : ''}{todaysReturnPercent.toFixed(2)}%)</span>
              </>
            ) : (
              <span>No return data</span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {lastUpdated ? `Updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Never updated'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioSummary;