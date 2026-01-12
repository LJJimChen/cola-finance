import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PortfolioSummary } from '@/components/portfolio-summary';
import { HoldingsList } from '@/components/holdings-list';
import { PortfolioRefreshButton } from '@/components/portfolio-refresh-button';
import { CurrencySelector } from '@/components/currency-selector';
import { usePortfolio } from '@/hooks/use-portfolio';
import { useConnections } from '@/hooks/use-brokers';
import { useAuth } from '@/lib/auth-context';

export const PortfolioPage: React.FC = () => {
  const {
    portfolioSummary,
    holdings,
    isLoading: isPortfolioLoading,
    refetch: refetchPortfolio
  } = usePortfolio();

  const {
    connections,
    isLoading: isConnectionsLoading
  } = useConnections();

  const {
    user,
    updateUserPreferences
  } = useAuth();

  const activeConnection = connections?.find(conn => conn.status === 'active');

  // State for selected currency
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    portfolioSummary?.displayCurrency || user?.display_currency || 'USD'
  );

  // Update currency when portfolio summary changes
  useEffect(() => {
    if (portfolioSummary?.displayCurrency) {
      setSelectedCurrency(portfolioSummary.displayCurrency);
    }
  }, [portfolioSummary?.displayCurrency]);

  const handleRefreshStart = () => {
    console.log('Refresh started');
  };

  const handleRefreshComplete = () => {
    refetchPortfolio();
    console.log('Refresh completed');
  };

  const handleRefreshError = (error: string) => {
    console.error('Refresh error:', error);
  };

  // Handle currency change
  const handleCurrencyChange = async (newCurrency: string) => {
    setSelectedCurrency(newCurrency);

    // Update user preferences to persist the selection
    if (user) {
      try {
        await updateUserPreferences({ display_currency: newCurrency });
      } catch (error) {
        console.error('Failed to update user preferences:', error);
        // Revert selection if update fails
        setSelectedCurrency(user.display_currency);
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">My Portfolio</h1>
          <div className="flex items-center gap-4">
            {activeConnection && (
              <PortfolioRefreshButton
                connectionId={activeConnection.id}
                onRefreshStart={handleRefreshStart}
                onRefreshComplete={handleRefreshComplete}
                onRefreshError={handleRefreshError}
              />
            )}
            <div className="w-40">
              <CurrencySelector
                value={selectedCurrency}
                onValueChange={handleCurrencyChange}
              />
            </div>
          </div>
        </div>

        {(isPortfolioLoading || isConnectionsLoading) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PortfolioSummary isLoading={true} />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <HoldingsList isLoading={true} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PortfolioSummary
                totalValue={portfolioSummary?.totalValue}
                todaysReturn={portfolioSummary?.todaysReturn}
                todaysReturnPercent={portfolioSummary?.todaysReturnPercent}
                lastUpdated={portfolioSummary?.lastUpdated}
                displayCurrency={selectedCurrency}
              />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <HoldingsList
                    holdings={holdings}
                    displayCurrency={selectedCurrency}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!activeConnection && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">You don't have any active broker connections.</p>
            <a href="/brokers" className="text-blue-600 hover:underline">
              Connect a broker to view your portfolio
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage;