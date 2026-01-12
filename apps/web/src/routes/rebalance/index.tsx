import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AllocationChart } from '@/components/allocation-chart'
import { DriftIndicator } from '@/components/drift-indicator'
import { AdjustmentSuggestions } from '@/components/adjustment-suggestions'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'

interface RebalancePreview {
  currentAllocation: Record<string, number>;
  targetAllocation: Record<string, number>;
  drift: Record<string, number>;
  adjustments: Array<{
    category: string;
    action: 'buy' | 'sell';
    amount: number;
  }>;
  portfolioValue: number;
  displayCurrency: string;
  computedAt: string;
}

export const RebalancePreviewPage: React.FC = () => {
  // Mock data for the rebalance preview
  const mockPreview: RebalancePreview = {
    currentAllocation: {
      stocks: 65.2,
      bonds: 15.8,
      funds: 12.1,
      cash: 4.5,
      crypto: 2.4,
    },
    targetAllocation: {
      stocks: 60,
      bonds: 20,
      funds: 10,
      cash: 5,
      crypto: 5,
    },
    drift: {
      stocks: 5.2,
      bonds: -4.2,
      funds: 2.1,
      cash: -0.5,
      crypto: -2.6,
    },
    adjustments: [
      { category: 'stocks', action: 'sell', amount: 5200 },
      { category: 'bonds', action: 'buy', amount: 4200 },
      { category: 'crypto', action: 'buy', amount: 2600 },
    ],
    portfolioValue: 100000,
    displayCurrency: 'USD',
    computedAt: new Date().toISOString(),
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="mr-3 h-8 w-8" />
              Rebalance Preview
            </h1>
            <p className="text-gray-600 mt-2">
              Compare your current allocation to your targets and see suggested adjustments
            </p>
          </div>
          <Button>
            Generate New Preview
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
                <CardDescription>
                  Current value and allocation compared to targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Portfolio Value</p>
                    <p className="text-2xl font-bold">
                      {mockPreview.displayCurrency} {mockPreview.portfolioValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Categories</p>
                    <p className="text-2xl font-bold">{Object.keys(mockPreview.currentAllocation).length}</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Drift</p>
                    <p className="text-2xl font-bold">
                      {Math.abs(Object.values(mockPreview.drift).reduce((sum, val) => sum + Math.abs(val), 0)).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drift Summary</CardTitle>
                <CardDescription>
                  How much your current allocation differs from your targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(mockPreview.drift).map(([category, drift]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium capitalize">{category}</span>
                      <DriftIndicator drift={drift} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Allocation Comparison</CardTitle>
                <CardDescription>
                  Visual comparison of current vs target allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AllocationChart 
                  currentAllocation={mockPreview.currentAllocation}
                  targetAllocation={mockPreview.targetAllocation}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Allocation</CardTitle>
                  <CardDescription>Your current portfolio distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(mockPreview.currentAllocation).map(([category, percentage]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Target Allocation</CardTitle>
                  <CardDescription>Your desired portfolio distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(mockPreview.targetAllocation).map(([category, percentage]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="capitalize">{category}</span>
                        <span className="font-medium">{percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Suggested Adjustments</CardTitle>
                <CardDescription>
                  Recommended actions to align your portfolio with targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdjustmentSuggestions adjustments={mockPreview.adjustments} currency={mockPreview.displayCurrency} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RebalancePreviewPage;
