import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import type { HistoricalPerformance } from '@repo/shared-types';

interface UseHistoricalPerformanceProps {
  portfolioId: string;
  startDate: Date;
  endDate: Date;
  displayCurrency?: string;
}

export const useHistoricalPerformance = ({ 
  portfolioId, 
  startDate, 
  endDate, 
  displayCurrency = 'CNY' 
}: UseHistoricalPerformanceProps) => {
  const apiClient = getApiClient();

  return useQuery<HistoricalPerformance, Error>({
    queryKey: ['historical-performance', portfolioId, startDate.toISOString(), endDate.toISOString(), displayCurrency],
    queryFn: () => apiClient.getHistoricalPerformance(portfolioId, startDate, endDate, displayCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
