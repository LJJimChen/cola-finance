import { useQuery } from '@tanstack/react-query';
import { getApiClient } from '@repo/shared-types';
import type { AllocationData } from '@repo/shared-types';

interface UseAllocationDataProps {
  portfolioId: string;
  displayCurrency?: string;
}

export const useAllocationData = ({ portfolioId, displayCurrency = 'CNY' }: UseAllocationDataProps) => {
  const apiClient = getApiClient();

  return useQuery<AllocationData, Error>({
    queryKey: ['allocation', portfolioId, displayCurrency],
    queryFn: () => apiClient.getAllocationData(portfolioId, displayCurrency),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
