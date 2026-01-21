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
    enabled: !!portfolioId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
