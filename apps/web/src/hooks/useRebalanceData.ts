import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import type { RebalanceRecommendations } from '@repo/shared-types';

interface UseRebalanceDataProps {
  portfolioId: string;
}

export const useRebalanceData = ({ portfolioId }: UseRebalanceDataProps) => {
  const apiClient = getApiClient();

  return useQuery<RebalanceRecommendations, Error>({
    queryKey: ['rebalance', portfolioId],
    queryFn: () => apiClient.getRebalanceRecommendations(portfolioId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
