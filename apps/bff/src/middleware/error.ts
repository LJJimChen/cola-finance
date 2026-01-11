/**
 * Error handling middleware
 * 
 * Intent: Catch and format errors consistently across all routes
 * Returns structured error responses with error_code and message
 * 
 * Contract:
 * - All errors return JSON with { error_code, message }
 * - Known errors (validation, auth) return appropriate status codes
 * - Unknown errors return 500 with generic message
 * - Errors logged for debugging (Constitution: No swallowed errors)
 */
import type { Context, Next } from 'hono'
import { ZodError } from 'zod'

/**
 * Global error handler
 * 
 * Input: Error object, Hono context
 * Output: JSON error response
 * Side effects: Logs error to console
 */
export async function errorHandler(err: Error, c: Context) {
  console.error('Error:', err)

  // Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        error_code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
      400
    )
  }

  // Custom application errors
  if (err instanceof AppError) {
    return c.json(
      {
        error_code: err.code,
        message: err.message,
      },
      err.statusCode
    )
  }

  // Unknown errors
  return c.json(
    {
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    500
  )
}

/**
 * Custom application error class
 * 
 * Intent: Structured errors with error codes and HTTP status
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Error handling middleware wrapper
 * 
 * Intent: Catch errors in route handlers and pass to error handler
 */
export function errorMiddleware() {
  return async (c: Context, next: Next) => {
    try {
      await next()
    } catch (err) {
      return errorHandler(err as Error, c)
    }
  }
}
