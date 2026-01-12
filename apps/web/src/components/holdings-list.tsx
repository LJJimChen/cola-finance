import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Holding {
  id: string;
  symbol: string;
  instrument_name: string;
  instrument_name_zh?: string;
  quantity: string;
  currency: string;
  market_value: string;
  cost_basis?: string;
  unrealized_pnl?: string;
  daily_return?: string;
  total_return?: string;
  category?: string;
  last_updated_at: string;
  is_stale: boolean;
  user_id: string;
  connection_id: string;
}

interface HoldingsListProps {
  holdings?: Holding[];
  isLoading?: boolean;
  displayCurrency?: string;
}

export const HoldingsList: React.FC<HoldingsListProps> = ({
  holdings,
  isLoading = false,
  displayCurrency = 'USD'
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Original Value</TableHead>
              <TableHead>Value ({displayCurrency})</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Daily Return</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, idx) => (
              <TableRow key={idx}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!holdings || holdings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No holdings to display. Connect a broker and refresh your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Original Value</TableHead>
            <TableHead>Value ({displayCurrency})</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Daily Return</TableHead>
            <TableHead className="text-right">Allocation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => {
            const originalValue = parseFloat(holding.market_value);
            const dailyReturn = holding.daily_return ? parseFloat(holding.daily_return) * 100 : 0;

            return (
              <TableRow
                key={holding.id}
                className={cn(holding.is_stale && "bg-yellow-50")}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {holding.symbol}
                    {holding.is_stale && (
                      <span className="ml-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                        Stale
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div>{holding.instrument_name}</div>
                    {holding.instrument_name_zh && (
                      <div className="text-xs text-gray-500">{holding.instrument_name_zh}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {parseFloat(holding.quantity).toLocaleString(undefined, {
                    maximumFractionDigits: 4
                  })}
                </TableCell>
                <TableCell>
                  {originalValue.toLocaleString(undefined, {
                    style: 'currency',
                    currency: holding.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                <TableCell>
                  {originalValue.toLocaleString(undefined, {
                    style: 'currency',
                    currency: displayCurrency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </TableCell>
                <TableCell>
                  {holding.category || '-'}
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    dailyReturn >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {dailyReturn >= 0 ? '+' : ''}{dailyReturn.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {/* This would be calculated based on total portfolio value */}
                  -
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default HoldingsList;