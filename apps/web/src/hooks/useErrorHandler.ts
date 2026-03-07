import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface ErrorHandler {
  handleApiError: (error: unknown, context?: string) => void;
  handleGenericError: (error: unknown, context?: string) => void;
}

export const useErrorHandler = (): ErrorHandler => {
  const queryClient = useQueryClient();

  const handleApiError = useCallback((error: unknown, context?: string) => {
    console.error(`API Error in ${context || 'unknown context'}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log error to monitoring service in production
    if (import.meta.env.MODE === 'production') {
      // In a real app, you would send this to a service like Sentry
      console.error('Logging error to monitoring service:', {
        error: errorMessage,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    }

    // Optionally invalidate queries to refresh data
    queryClient.invalidateQueries();
  }, [queryClient]);

  const handleGenericError = useCallback((error: unknown, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Log error to monitoring service in production
    if (import.meta.env.MODE === 'production') {
      // In a real app, you would send this to a service like Sentry
      console.error('Logging error to monitoring service:', {
        error: errorMessage,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    }
  }, []);

  return {
    handleApiError,
    handleGenericError,
  };
};
