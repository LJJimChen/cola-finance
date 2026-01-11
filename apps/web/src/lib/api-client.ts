/**
 * API client using ky
 * 
 * Intent: Provide type-safe HTTP client for BFF API calls
 * Handles authentication, error responses, and retries
 * 
 * Contract:
 * - Automatically includes JWT token in Authorization header
 * - Parses structured error responses from BFF
 * - Retries failed requests with exponential backoff
 */
import ky, { type KyInstance } from 'ky'

/**
 * API error response structure (from BFF)
 */
export interface ApiError {
  error_code: string
  message: string
  details?: unknown
}

/**
 * Custom API error class
 */
export class ApiRequestError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

/**
 * Create authenticated API client
 * 
 * Intent: Initialize ky client with base URL and auth hooks
 * 
 * Input: Optional auth token
 * Output: Configured ky instance
 */
export function createApiClient(token?: string): KyInstance {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

  return ky.create({
    prefixUrl: baseUrl,
    timeout: 30000, // 30 seconds
    retry: {
      limit: 2,
      methods: ['get'],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeRequest: [
        (request) => {
          // Add auth token if available
          if (token) {
            request.headers.set('Authorization', `Bearer ${token}`)
          }

          // Add Content-Type for JSON requests
          if (!request.headers.has('Content-Type')) {
            request.headers.set('Content-Type', 'application/json')
          }
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          // Handle non-OK responses
          if (!response.ok) {
            const error: ApiError = await response.json()

            throw new ApiRequestError(
              error.error_code || 'UNKNOWN_ERROR',
              error.message || 'An error occurred',
              response.status,
              error.details
            )
          }

          return response
        },
      ],
    },
  })
}

/**
 * Get default API client instance
 * 
 * Intent: Provide singleton client for unauthenticated requests
 * For authenticated requests, use createApiClient(token)
 */
export const apiClient = createApiClient()
