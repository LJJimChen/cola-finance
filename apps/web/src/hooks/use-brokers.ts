import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Define types based on the schema
interface Broker {
  id: string;
  name: string;
  name_zh: string;
  logo_url: string;
  supported: boolean;
  adapter_version: string;
  requires_verification: boolean;
  created_at: string;
  updated_at: string;
}

interface BrokerConnection {
  id: string;
  user_id: string;
  broker_id: string;
  status: 'active' | 'expired' | 'revoked' | 'failed';
  authorized_at: string;
  expires_at: string | null;
  last_refresh_at: string | null;
  consecutive_failures: number;
  last_error_code: string | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
  broker: Broker;
}

interface ConnectBrokerResponse {
  taskId: string;
  token: string;
}

interface RefreshConnectionResponse {
  taskId: string;
}

// Hook for fetching all brokers
export const useBrokers = () => {
  return useQuery<Broker[]>({
    queryKey: ['brokers'],
    queryFn: async () => {
      const response = await apiClient.GET('/brokers');
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch brokers');
      }
      return response.data || [];
    },
  });
};

// Hook for connecting a broker
export const useConnectBroker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (brokerId: string) => {
      const response = await apiClient.POST('/brokers/{brokerId}/connect', {
        params: {
          path: { brokerId },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate broker connection');
      }
      
      return {
        taskId: response.data?.taskId || '',
        token: response.data?.token || ''
      } as ConnectBrokerResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
};

// Hook for fetching user's broker connections
export const useConnections = () => {
  return useQuery<BrokerConnection[]>({
    queryKey: ['connections'],
    queryFn: async () => {
      const response = await apiClient.GET('/brokers/connections');
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch connections');
      }
      return response.data || [];
    },
  });
};

// Hook for refreshing a connection
export const useRefreshConnection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.POST('/brokers/connections/{connectionId}/refresh', {
        params: {
          path: { connectionId },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate refresh');
      }
      
      return {
        taskId: response.data?.taskId || ''
      } as RefreshConnectionResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
};

// Hook for revoking a connection
export const useRevokeConnection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiClient.DELETE('/brokers/connections/{connectionId}', {
        params: {
          path: { connectionId },
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to revoke connection');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });
};

// Combined hook that provides all broker-related operations
export const useBrokerOperations = () => {
  const brokers = useBrokers();
  const connectBrokerMutation = useConnectBroker();
  const connections = useConnections();
  const refreshConnectionMutation = useRefreshConnection();
  const revokeConnectionMutation = useRevokeConnection();
  
  return {
    // Queries
    brokers: brokers.data,
    isLoadingBrokers: brokers.isLoading,
    errorBrokers: brokers.error,
    
    connections: connections.data,
    isLoadingConnections: connections.isLoading,
    errorConnections: connections.error,
    
    // Mutations
    connectBroker: connectBrokerMutation.mutateAsync,
    isConnecting: connectBrokerMutation.isPending,
    
    refreshConnection: refreshConnectionMutation.mutateAsync,
    isRefreshing: refreshConnectionMutation.isPending,
    refreshStatus: refreshConnectionMutation.data, // This would need to be updated based on task status
    
    revokeConnection: revokeConnectionMutation.mutateAsync,
    isRevoking: revokeConnectionMutation.isPending,
  };
};