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
  const startDateKey = startDate.toISOString().split('T')[0];
  const endDateKey = endDate.toISOString().split('T')[0];

  return useQuery<HistoricalPerformance, Error>({
    queryKey: ['historical-performance', portfolioId, startDateKey, endDateKey, displayCurrency],
    queryFn: () => apiClient.getHistoricalPerformance(portfolioId, startDate, endDate, displayCurrency),
    enabled: !!portfolioId,
    placeholderData: (previousData) => previousData,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};
