import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useI18n } from '../lib/i18n';
import Layout from '../components/Layout';
import AllocationChart from '../components/charts/AllocationChart';
import Skeleton from '../components/Skeleton';

const DashboardPage: React.FC = () => {
  const { t } = useI18n();

  // Mock portfolio ID - in a real app, this would come from routing
  const portfolioId = 'portfolio-123';

  // State for currency selection
  const [displayCurrency, setDisplayCurrency] = useState('USD');

  const { data: dashboardData, isLoading, error } = useDashboardData({
    portfolioId,
    displayCurrency
  });

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
          <h1 className="text-2xl font-bold">{isLoading ? <Skeleton width={120} height={30} /> : t('dashboard.title')}</h1>
          {/* Currency selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="currency-select">{t('settings.currency')}:</label>
            <select
              id="currency-select"
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="border rounded p-1"
              disabled={isLoading}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CNY">CNY</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.totalValue')}</h3>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton width={100} height={30} />
              ) : (
                dashboardData?.totalValue?.toLocaleString(undefined, {
                  style: 'currency',
                  currency: dashboardData?.currency || 'USD',
                })
              )}
            </p>
          </div>

          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.dailyProfit')}</h3>
            <p className={`text-2xl font-bold ${dashboardData?.dailyProfit && dashboardData.dailyProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {isLoading ? (
                <Skeleton width={100} height={30} />
              ) : (
                dashboardData?.dailyProfit?.toLocaleString(undefined, {
                  style: 'currency',
                  currency: dashboardData?.currency || 'USD',
                })
              )}
            </p>
          </div>

          <div className="bg-card p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-muted-foreground">{t('dashboard.annualReturn')}</h3>
            <p className={`text-2xl font-bold ${dashboardData?.annualReturn && dashboardData.annualReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {isLoading ? (
                <Skeleton width={80} height={30} />
              ) : (
                `${dashboardData?.annualReturn?.toFixed(2)}%`
              )}
            </p>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.allocationChart')}</h2>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton width="100%" height="100%" />
            </div>
          ) : (
            dashboardData?.allocationByCategory && (
              <AllocationChart
                data={dashboardData.allocationByCategory.map(cat => ({
                  name: cat.categoryName,
                  value: cat.value,
                  percentage: cat.percentage
                }))}
                title={t('dashboard.allocationChart')}
              />
            )
          )}
        </div>

        {/* Top Performing Assets */}
        <div className="bg-card p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">{t('dashboard.topPerformers')}</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between py-2 border-b">
                  <Skeleton width={80} height={20} />
                  <Skeleton width={60} height={20} />
                  <Skeleton width={100} height={20} />
                </div>
              ))}
            </div>
          ) : (
            dashboardData?.topPerformingAssets && dashboardData.topPerformingAssets.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.symbol')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.name')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">{t('common.dailyProfit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dashboardData.topPerformingAssets.map((asset) => (
                      <tr key={asset.id}>
                        <td className="px-4 py-2">{asset.symbol}</td>
                        <td className="px-4 py-2">{asset.name}</td>
                        <td className={`px-4 py-2 ${asset.dailyProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.dailyProfit.toLocaleString(undefined, {
                            style: 'currency',
                            currency: asset.currency,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;