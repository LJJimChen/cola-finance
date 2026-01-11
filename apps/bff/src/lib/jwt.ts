/**
 * JWT token generation and validation utilities
 * 
 * Intent: Generate short-lived JWT tokens for Engine delegation
 * BFF issues 5-minute tokens that Engine validates before executing tasks
 * 
 * Contract:
 * - Session tokens: Long-lived for frontend authentication
 * - Delegation tokens: 5-minute lifetime for Engine access
 * - Tokens bound to specific task_id and user_id
 */

/**
 * JWT payload for session tokens (frontend authentication)
 */
export interface SessionTokenPayload {
  sub: string // user_id
  email: string
  iat: number // issued at
  exp: number // expires at
}

/**
 * JWT payload for delegation tokens (Engine access)
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
 * Generate session token for frontend authentication
 * 
 * Intent: Create JWT for user session (24 hour expiry)
 * 
 * Input: User ID, email, JWT secret
 * Output: Signed JWT string
 * Side effects: None
 */
export async function generateSessionToken(
  userId: string,
  email: string,
  secret: string
): Promise<string> {
  const payload: SessionTokenPayload = {
    sub: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  }

  return await signJWT(payload, secret)
}

/**
 * Generate delegation token for Engine access
 * 
 * Intent: Create short-lived JWT for Engine task execution (5 minute expiry)
 * 
 * Input: User ID, task ID, task type, optional broker ID, JWT secret
 * Output: Signed JWT string
 * Side effects: None
 */
export async function generateDelegationToken(
  userId: string,
  taskId: string,
  taskType: 'broker_authorization' | 'data_collection',
  secret: string,
  brokerId?: string
): Promise<string> {
  const payload: DelegationTokenPayload = {
    iss: 'bff.cola-finance.app',
    sub: userId,
    aud: 'engine.cola-finance.internal',
    exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes
    iat: Math.floor(Date.now() / 1000),
    task_id: taskId,
    task_type: taskType,
    broker_id: brokerId,
  }

  return await signJWT(payload, secret)
}

/**
 * Sign JWT using Web Crypto API (Cloudflare Workers compatible)
 * 
 * Intent: Create signed JWT token using HMAC-SHA256
 * 
 * Input: Payload object, secret string
 * Output: JWT string (header.payload.signature)
 * Side effects: None
 */
async function signJWT(payload: unknown, secret: string): Promise<string> {
  const encoder = new TextEncoder()

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  const message = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))

  const encodedSignature = base64UrlEncode(signature)

  return `${message}.${encodedSignature}`
}

/**
 * Verify JWT signature and extract payload
 * 
 * Intent: Validate JWT and return decoded payload
 * 
 * Input: JWT string, secret string
 * Output: Decoded payload or null if invalid
 * Side effects: None
 */
export async function verifyJWT<T = Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null
    }

    const message = `${encodedHeader}.${encodedPayload}`
    const encoder = new TextEncoder()

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signature = base64UrlDecode(encodedSignature)
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message))

    if (!isValid) {
      return null
    }

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload)))

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload as T
  } catch {
    return null
  }
}

/**
 * Base64 URL encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(data: string): Uint8Array {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(base64 + padding)
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0))
}
