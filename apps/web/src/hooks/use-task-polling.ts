import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// Define types based on the schema
interface Task {
  id: string;
  user_id: string;
  broker_id: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'failed' | 'expired';
  state_snapshot: string;
  verification_url?: string;
  verification_type?: 'captcha' | '2fa' | 'consent';
  connection_id?: string;
  error_code?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at?: string;
}

interface UseTaskPollingOptions {
  refetchInterval?: number; // milliseconds, default 3000 (3 seconds)
  enabled?: boolean; // whether polling is enabled, default true
}

export const useTaskPolling = (options: UseTaskPollingOptions = {}) => {
  const { refetchInterval = 3000, enabled = true } = options;
  const queryClient = useQueryClient();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // The query for fetching task status
  const queryResult = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) {
        throw new Error('Task ID is required');
      }

      const response = await apiClient.GET('/tasks/{taskId}', {
        params: {
          path: { taskId },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch task status');
      }

      return response.data as Task;
    },
    enabled: !!taskId && enabled && isPolling,
    refetchInterval: isPolling ? refetchInterval : false,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 30000,
  });

  // Start polling for a specific task
  const startPolling = (id: string) => {
    setTaskId(id);
    setIsPolling(true);
  };

  // Stop polling
  const stopPolling = () => {
    setIsPolling(false);
  };

  // Reset the hook to initial state
  const reset = () => {
    setTaskId(null);
    setIsPolling(false);
    queryClient.removeQueries({ queryKey: ['task'] });
  };

  // Check if the task has reached a terminal state
  const isTerminalState = (status: string | undefined) => {
    return status === 'completed' || status === 'failed' || status === 'expired';
  };

  // Auto-stop polling when reaching terminal state
  useEffect(() => {
    if (queryResult.data && isTerminalState(queryResult.data.status)) {
      stopPolling();
    }
  }, [queryResult.data]);

  return {
    task: queryResult.data,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    isPolling,
    startPolling,
    stopPolling,
    reset,
    refetch: queryResult.refetch,
  };
};