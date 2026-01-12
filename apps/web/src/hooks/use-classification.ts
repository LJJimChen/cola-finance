import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Define types based on the schema
interface ClassificationScheme {
  id: string;
  userId: string | null;
  name: string;
  nameZh?: string;
  description?: string;
  isPreset: boolean;
  categories: Array<{
    id: string;
    name: string;
    nameZh?: string;
    rules?: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TargetAllocation {
  id: string;
  userId: string;
  schemeId: string;
  targets: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface RebalancePreview {
  id: string;
  userId: string;
  schemeId: string;
  targetId: string;
  currentAllocation: Record<string, number>;
  drift: Record<string, number>;
  adjustments: Array<{
    category: string;
    action: 'buy' | 'sell';
    amount: number;
  }>;
  portfolioValue: number;
  displayCurrency: string;
  computedAt: string;
}

// Hook for fetching classification schemes
export const useClassificationSchemes = () => {
  return useQuery<ClassificationScheme[]>({
    queryKey: ['classification', 'schemes'],
    queryFn: async () => {
      const response = await apiClient.GET('/classification/schemes');
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch classification schemes');
      }
      return response.data?.schemes || [];
    },
  });
};

// Hook for creating a classification scheme
export const useCreateClassificationScheme = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schemeData: {
      name: string;
      nameZh?: string;
      description?: string;
      categories: Array<{
        id: string;
        name: string;
        nameZh?: string;
        rules?: Record<string, unknown>;
      }>;
    }) => {
      const response = await apiClient.POST('/classification/schemes', {
        body: JSON.stringify(schemeData),
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create classification scheme');
      }
      
      return response.data?.scheme as ClassificationScheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'schemes'] });
    },
  });
};

// Hook for fetching target allocation for a scheme
export const useTargetAllocation = (schemeId: string) => {
  return useQuery<TargetAllocation>({
    queryKey: ['classification', 'targets', schemeId],
    queryFn: async () => {
      const response = await apiClient.GET('/classification/schemes/{schemeId}/targets', {
        params: {
          path: { schemeId },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch target allocation');
      }
      
      return response.data?.targets as TargetAllocation;
    },
    enabled: !!schemeId,
  });
};

// Hook for setting target allocation for a scheme
export const useSetTargetAllocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ schemeId, targets }: { schemeId: string; targets: Record<string, number> }) => {
      const response = await apiClient.PUT('/classification/schemes/{schemeId}/targets', {
        params: {
          path: { schemeId },
        },
        body: JSON.stringify({ targets }),
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to set target allocation');
      }
      
      return response.data?.targets as TargetAllocation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classification', 'targets', variables.schemeId] });
    },
  });
};

// Hook for fetching rebalance preview
export const useRebalancePreview = (schemeId: string, displayCurrency?: string) => {
  return useQuery<RebalancePreview>({
    queryKey: ['classification', 'rebalance-preview', schemeId, displayCurrency],
    queryFn: async () => {
      const queryParams = displayCurrency ? { currency: displayCurrency } : {};
      const response = await apiClient.GET('/classification/schemes/{schemeId}/rebalance-preview', {
        params: {
          path: { schemeId },
          query: queryParams,
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch rebalance preview');
      }
      
      return response.data as RebalancePreview;
    },
    enabled: !!schemeId,
  });
};

// Combined hook that provides all classification-related operations
export const useClassificationOperations = () => {
  const schemesQuery = useClassificationSchemes();
  const createSchemeMutation = useCreateClassificationScheme();
  
  return {
    // Queries
    schemes: schemesQuery.data,
    isLoadingSchemes: schemesQuery.isLoading,
    errorSchemes: schemesQuery.error,
    
    // Mutations
    createScheme: createSchemeMutation.mutateAsync,
    isCreatingScheme: createSchemeMutation.isPending,
    
    // Individual hooks for specific operations
    useTargetAllocation,
    useSetTargetAllocation,
    useRebalancePreview,
  };
};