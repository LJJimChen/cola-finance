/**
 * Authentication middleware
 * 
 * Intent: Verify JWT tokens on protected routes
 * Extracts user information from token and attaches to context
 * 
 * Contract:
 * - Checks Authorization header for Bearer token
 * - Validates JWT signature and expiration
 * - Attaches user_id to context for downstream handlers
 * - Returns 401 if token missing or invalid
 */
import type { Context, Next } from 'hono'
import { verifyJWT, type SessionTokenPayload } from '../lib/jwt'

/**
 * Authentication middleware
 * 
 * Input: Hono context, next handler
 * Output: None (calls next or returns 401)
 * Side effects: Modifies context with user information
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'Missing or invalid token' }, 401)
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  const secret = c.env.JWT_SECRET
  if (!secret) {
    console.error('JWT_SECRET not configured')
    return c.json({ error_code: 'SERVER_ERROR', message: 'Server configuration error' }, 500)
  }

  const payload = await verifyJWT<SessionTokenPayload>(token, secret)

  if (!payload) {
    return c.json({ error_code: 'INVALID_TOKEN', message: 'Invalid or expired token' }, 401)
  }

  // Attach user info to context
  c.set('userId', payload.sub)
  c.set('userEmail', payload.email)

  await next()
}
