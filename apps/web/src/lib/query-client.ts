/**
 * TanStack Query client configuration
 * 
 * Intent: Configure React Query for data fetching and caching
 * Provides consistent settings for all API queries
 * 
 * Contract:
 * - Default stale time: 5 minutes
 * - Retry failed requests 3 times
 * - Cache data for 10 minutes
 */
import { QueryClient } from '@tanstack/react-query'

/**
 * Create and configure Query Client
 * 
 * Intent: Initialize React Query with sensible defaults
 * 
 * Output: Configured QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})
