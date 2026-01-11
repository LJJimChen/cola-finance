/**
 * Validation middleware
 * 
 * Intent: Validate request body, query, and params using Zod schemas
 * Provides type-safe validation for all API endpoints
 * 
 * Contract:
 * - Validates request data against Zod schema
 * - Returns 400 with validation errors if invalid
 * - Attaches validated data to context for downstream handlers
 */
import type { Context, Next } from 'hono'
import type { ZodSchema } from 'zod'

/**
 * Validate request body
 * 
 * Intent: Parse and validate JSON request body
 * 
 * Input: Zod schema
 * Output: Middleware function
 * Side effects: Attaches validated data to context
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const body = await c.req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return c.json(
        {
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.errors,
        },
        400
      )
    }

    c.set('validatedBody', result.data)
    await next()
  }
}

/**
 * Validate query parameters
 * 
 * Intent: Parse and validate URL query parameters
 * 
 * Input: Zod schema
 * Output: Middleware function
 * Side effects: Attaches validated data to context
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const query = c.req.query()
    const result = schema.safeParse(query)

    if (!result.success) {
      return c.json(
        {
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: result.error.errors,
        },
        400
      )
    }

    c.set('validatedQuery', result.data)
    await next()
  }
}

/**
 * Validate path parameters
 * 
 * Intent: Parse and validate URL path parameters
 * 
 * Input: Zod schema
 * Output: Middleware function
 * Side effects: Attaches validated data to context
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    const params = c.req.param()
    const result = schema.safeParse(params)

    if (!result.success) {
      return c.json(
        {
          error_code: 'VALIDATION_ERROR',
          message: 'Invalid path parameters',
          details: result.error.errors,
        },
        400
      )
    }

    c.set('validatedParams', result.data)
    await next()
  }
}
