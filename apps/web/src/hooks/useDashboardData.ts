import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import type { DashboardData } from '@repo/shared-types';

interface UseDashboardDataProps {
  portfolioId: string;
  displayCurrency?: string;
}

export const useDashboardData = ({ portfolioId, displayCurrency = 'CNY' }: UseDashboardDataProps) => {
  const apiClient = getApiClient();

  return useQuery<DashboardData, Error>({
    queryKey: ['dashboard', portfolioId, displayCurrency],
    queryFn: () => apiClient.getDashboardData(portfolioId, displayCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};