import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface Adjustment {
  category: string;
  action: 'buy' | 'sell';
  amount: number;
}

interface AdjustmentSuggestionsProps {
  adjustments: Adjustment[];
  currency: string;
}

export const AdjustmentSuggestions: React.FC<AdjustmentSuggestionsProps> = ({ 
  adjustments, 
  currency 
}) => {
  if (!adjustments || adjustments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No adjustments needed. Your portfolio is aligned with your targets!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {adjustments.map((adjustment, index) => (
        <div 
          key={index} 
          className={`flex items-center justify-between p-4 rounded-lg border ${
            adjustment.action === 'buy' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center">
            {adjustment.action === 'buy' ? (
              <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600 mr-3" />
            )}
            <div>
              <h3 className="font-medium capitalize">{adjustment.category}</h3>
              <p className="text-sm text-gray-600">
                {adjustment.action === 'buy' ? 'Increase allocation' : 'Decrease allocation'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-medium">
              {adjustment.action === 'buy' ? '+' : '-'}{currency} {adjustment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Badge 
              variant={adjustment.action === 'buy' ? 'default' : 'destructive'} 
              className="mt-1"
            >
              {adjustment.action.toUpperCase()}
            </Badge>
          </div>
        </div>
      ))}
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Actions to align your portfolio with targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Buy Actions</p>
              <p className="text-xl font-bold text-green-700">
                {adjustments.filter(a => a.action === 'buy').length}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Sell Actions</p>
              <p className="text-xl font-bold text-red-700">
                {adjustments.filter(a => a.action === 'sell').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdjustmentSuggestions;