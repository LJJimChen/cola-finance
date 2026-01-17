import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface ErrorHandler {
  handleApiError: (error: any, context?: string) => void;
  handleGenericError: (error: any, context?: string) => void;
}

export const useErrorHandler = (): ErrorHandler => {
  const queryClient = useQueryClient();

  const handleApiError = useCallback((error: any, context?: string) => {
    console.error(`API Error in ${context || 'unknown context'}:`, error);
    
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // In a real app, you would send this to a service like Sentry
      console.error('Logging error to monitoring service:', {
        error: error.message || error,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    }

    // Optionally invalidate queries to refresh data
    queryClient.invalidateQueries();
  }, [queryClient]);

  const handleGenericError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // In a real app, you would send this to a service like Sentry
      console.error('Logging error to monitoring service:', {
        error: error.message || error,
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