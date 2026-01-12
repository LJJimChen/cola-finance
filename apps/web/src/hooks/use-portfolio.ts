import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Define types based on the schema
interface PortfolioSummary {
  totalValue: number;
  todaysReturn?: number;
  todaysReturnPercent?: number;
  lastUpdated: string;
  displayCurrency: string;
}

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

interface GetPortfolioParams {
  currency?: string;
}

interface GetHoldingsParams {
  currency?: string;
}

// Hook for fetching portfolio summary
export const usePortfolioSummary = (params?: GetPortfolioParams) => {
  return useQuery<PortfolioSummary>({
    queryKey: ['portfolio', 'summary', params],
    queryFn: async () => {
      const queryParams = params?.currency ? { currency: params.currency } : {};
      const response = await apiClient.GET('/portfolio', {
        params: { query: queryParams }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch portfolio summary');
      }

      return {
        totalValue: response.data?.totalValue || 0,
        todaysReturn: response.data?.todaysReturn,
        todaysReturnPercent: response.data?.todaysReturnPercent,
        lastUpdated: response.data?.lastUpdated || new Date().toISOString(),
        displayCurrency: response.data?.displayCurrency || 'USD'
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Hook for fetching holdings
export const useHoldings = (params?: GetHoldingsParams) => {
  return useQuery<Holding[]>({
    queryKey: ['portfolio', 'holdings', params],
    queryFn: async () => {
      const queryParams = params?.currency ? { currency: params.currency } : {};
      const response = await apiClient.GET('/portfolio/holdings', {
        params: { query: queryParams }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch holdings');
      }

      return response.data || [];
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

// Combined hook that provides both portfolio summary and holdings
export const usePortfolio = (params?: GetPortfolioParams) => {
  const queryClient = useQueryClient();

  const portfolioSummary = usePortfolioSummary(params);
  const holdings = useHoldings(params);

  // Refetch both queries when currency changes
  const refetch = (newParams?: GetPortfolioParams) => {
    const effectiveParams = newParams || params;
    queryClient.invalidateQueries({ queryKey: ['portfolio', 'summary', effectiveParams] });
    queryClient.invalidateQueries({ queryKey: ['portfolio', 'holdings', effectiveParams] });
  };

  return {
    // Portfolio summary
    portfolioSummary: portfolioSummary.data,
    isLoadingSummary: portfolioSummary.isLoading,
    errorSummary: portfolioSummary.error,
    refetchSummary: portfolioSummary.refetch,

    // Holdings
    holdings: holdings.data,
    isLoadingHoldings: holdings.isLoading,
    errorHoldings: holdings.error,
    refetchHoldings: holdings.refetch,

    // Combined loading state
    isLoading: portfolioSummary.isLoading || holdings.isLoading,
    error: portfolioSummary.error || holdings.error,

    // Refetch both with optional new parameters
    refetch: (newParams?: GetPortfolioParams) => refetch(newParams),

    // Currency-specific refetch
    refetchWithCurrency: (currency: string) => refetch({ currency }),
  };
};