import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import type { Portfolio } from '@repo/shared-types';

export function useCurrentPortfolio() {
  const apiClient = getApiClient();
  const { data: portfolio, isLoading: loading, error } = useQuery<Portfolio | null, Error>({
    queryKey: ['current-portfolio'],
    queryFn: async () => {
      const portfolios = await apiClient.getPortfolios();
      return portfolios[0] ?? null;
    },
  });

  return {
    portfolio,
    portfolioId: portfolio?.id || null,
    loading,
    error: error ?? null,
  };
}
