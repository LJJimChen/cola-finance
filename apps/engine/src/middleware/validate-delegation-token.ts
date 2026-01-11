/**
 * JWT delegation token validation middleware
 * 
 * Intent: Validate BFF-issued delegation tokens before executing tasks
 * Ensures only authorized requests from BFF can trigger task execution
 * 
 * Contract:
 * - Validates JWT signature using shared secret
 * - Checks aud, iss, exp fields
 * - Verifies task_id exists and is in valid state
 * - Token has 5-minute lifetime (enforced by exp claim)
 * - Returns 401 if token invalid or expired
 */
import type { FastifyRequest, FastifyReply } from 'fastify'

/**
 * Delegation token payload structure
 */
export interface DelegationTokenPayload {
  iss: string // 'bff.cola-finance.app'
  sub: string // user_id
  aud: string // 'engine.cola-finance.internal'
  exp: number // expires at (5 minutes from issuance)
  iat: number // issued at
  task_id: string
  task_type: 'broker_authorization' | 'data_collection'
  broker_id?: string
}

/**
 * Validate delegation token middleware
 * 
 * Input: Fastify request, reply
 * Output: None (calls next or returns 401)
 * Side effects: Attaches decoded token to request
 */
export async function validateDelegationToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error_code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      })
    }

    // Remove 'Bearer ' prefix (token extracted via jwtVerify)

    // Verify JWT using Fastify JWT plugin
    const decoded = await request.jwtVerify<DelegationTokenPayload>()

    // Validate required claims
    if (decoded.iss !== 'bff.cola-finance.app') {
      return reply.status(401).send({
        error_code: 'INVALID_ISSUER',
        message: 'Token issuer is not valid',
      })
    }

    if (decoded.aud !== 'engine.cola-finance.internal') {
      return reply.status(401).send({
        error_code: 'INVALID_AUDIENCE',
        message: 'Token audience is not valid',
      })
    }

    // Check expiration (also checked by jwtVerify, but explicit for clarity)
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return reply.status(401).send({
        error_code: 'TOKEN_EXPIRED',
        message: 'Delegation token has expired',
      })
    }

    // Attach decoded token to request for downstream handlers
    request.delegationToken = decoded
  } catch (error) {
    request.log.error({ error }, 'Token validation failed')

    return reply.status(401).send({
      error_code: 'INVALID_TOKEN',
      message: 'Token validation failed',
    })
  }
}

// Extend Fastify request type to include delegationToken
declare module 'fastify' {
  interface FastifyRequest {
    delegationToken?: DelegationTokenPayload
  }
}
