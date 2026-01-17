import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';

const RebalancePage: React.FC = () => {
  const { t } = useI18n();
  const apiClient = getApiClient();
  const queryClient = useQueryClient();
  
  // Mock portfolio ID - in a real app, this would come from routing
  const portfolioId = 'portfolio-123';
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  const { data: rebalanceData, isLoading, error } = useQuery({
    queryKey: ['rebalance', portfolioId],
    queryFn: () => apiClient.getRebalanceRecommendations(portfolioId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ categoryId, targetAllocation }: { categoryId: string; targetAllocation: number }) => {
      return apiClient.updateCategory(categoryId, { targetAllocation });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rebalance', portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['allocation', portfolioId, displayCurrency] });
    },
  });

  const handleTargetAllocationChange = (categoryId: string, newTarget: number) => {
    updateCategoryMutation.mutate({ categoryId, targetAllocation: newTarget });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <p>{t('common.loading')}...</p>
        </div>
      </Layout>
    );
  }

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('rebalance.title')}</h1>
          {/* Currency selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="currency-select">{t('settings.currency')}:</label>
            <select 
              id="currency-select"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="border rounded p-1"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CNY">CNY</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>

        {rebalanceData && rebalanceData.recommendations.length > 0 ? (
          <div className="space-y-4">
            {rebalanceData.recommendations.map((rec) => (
              <div key={rec.categoryId} className="bg-card p-4 rounded-lg shadow">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold">{rec.categoryName}</h2>
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="text-sm text-muted-foreground">{t('rebalance.targetAllocation')}</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          defaultValue={rec.targetAllocation}
                          onBlur={(e) => {
                            const newTarget = parseFloat(e.target.value);
                            if (!isNaN(newTarget) && newTarget >= 0 && newTarget <= 100) {
                              handleTargetAllocationChange(rec.categoryId, newTarget);
                            }
                          }}
                          className="w-20 border rounded p-1 text-right"
                        />
                        <span>%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t('rebalance.currentAllocation')}</label>
                      <div className="text-right">
                        {rec.currentAllocation.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="text-sm text-muted-foreground">{t('rebalance.deviation')}</label>
                  <div className={`text-lg font-medium ${rec.deviation >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {rec.deviation >= 0 ? '+' : ''}{rec.deviation.toFixed(2)}%
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="text-sm text-muted-foreground">{t('rebalance.recommendations')}</label>
                  <div className="p-2 bg-muted rounded">
                    {rec.recommendation}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-muted-foreground">{t('rebalance.suggestedActions')}</label>
                  <ul className="list-disc pl-5 space-y-1">
                    {rec.suggestedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card p-4 rounded-lg shadow text-center">
            <p>{t('common.noData')}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RebalancePage;