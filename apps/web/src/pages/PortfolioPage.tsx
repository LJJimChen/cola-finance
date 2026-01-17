import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import AllocationChart from '../components/charts/AllocationChart';

const PortfolioPage: React.FC = () => {
  const { t } = useI18n();
  const apiClient = getApiClient();
  
  // Mock portfolio ID - in a real app, this would come from routing
  const portfolioId = 'portfolio-123';
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  const { data: allocationData, isLoading, error } = useQuery({
    queryKey: ['allocation', portfolioId, displayCurrency],
    queryFn: () => apiClient.getAllocationData(portfolioId, displayCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
          <h1 className="text-2xl font-bold">{t('portfolio.title')}</h1>
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

        {/* Portfolio Allocation */}
        {allocationData && (
          <div className="bg-card p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">{t('portfolio.allocation')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <AllocationChart 
                  data={allocationData.categories.map(cat => ({
                    name: cat.name,
                    value: cat.value,
                    percentage: cat.currentAllocation
                  }))}
                  title={t('portfolio.allocation')}
                />
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('portfolio.profit')} & {t('common.yield')}</h3>
                <div className="space-y-2">
                  {allocationData.categories.map((category) => (
                    <div key={category.id} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="font-medium">
                          {category.value.toLocaleString(undefined, {
                            style: 'currency',
                            currency: allocationData.currency,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('portfolio.profit')}:</span>
                        <span className={category.profitAmount >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {category.profitAmount.toLocaleString(undefined, {
                            style: 'currency',
                            currency: allocationData.currency,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('common.yield')}:</span>
                        <span>{category.yield.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assets by Category */}
        {allocationData && allocationData.categories.map((category) => (
          <div key={category.id} className="bg-card p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <span className="text-sm">
                {category.currentAllocation.toFixed(2)}% of portfolio
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.symbol')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.name')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('portfolio.quantity')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.value')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('portfolio.profit')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.yield')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {category.assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-4 py-2">{asset.symbol}</td>
                      <td className="px-4 py-2">{asset.name}</td>
                      <td className="px-4 py-2">{asset.quantity}</td>
                      <td className="px-4 py-2">
                        {asset.value.toLocaleString(undefined, {
                          style: 'currency',
                          currency: allocationData.currency,
                        })}
                      </td>
                      <td className={`px-4 py-2 ${asset.profitAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.profitAmount.toLocaleString(undefined, {
                          style: 'currency',
                          currency: allocationData.currency,
                        })}
                      </td>
                      <td className="px-4 py-2">{asset.yield.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Add Asset Button */}
        <div className="flex justify-end">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
            {t('portfolio.addAsset')}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioPage;