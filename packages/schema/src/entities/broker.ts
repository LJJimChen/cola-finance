/**
 * Broker entity type definitions
 * 
 * Intent: Define Broker and BrokerConnection entity structures
 * Brokers represent supported external platforms (e.g., securities brokers)
 * BrokerConnections represent a user's authorized relationship to a broker
 * 
 * Contract:
 * - Broker: Supported platform with adapter_version
 * - BrokerConnection: User's authorization to access broker data
 * - NO broker credentials stored (Constitution Principle: No credential storage)
 * - Connection status explicitly tracked with state transitions
 */
import { z } from 'zod'

/**
 * Broker entity schema
 * 
 * Represents a supported external platform (e.g., Futu, Tiger Securities)
 */
export const BrokerSchema = z.object({
  id: z.string(), // Slug format (e.g., 'futu', 'tiger')
  name: z.string(),
  name_zh: z.string(),
  logo_url: z.string().url(),
  default_currency: z.string().length(3), // ISO 4217 code
  supported: z.boolean(),
  adapter_version: z.string(), // Semver (e.g., '1.0.0')
  requires_verification: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Broker = z.infer<typeof BrokerSchema>

/**
 * Broker connection status
 * 
 * State transitions:
 * - active → expired (when expires_at passes)
 * - active → revoked (user-initiated)
 * - active → failed (3+ consecutive failures)
 */
export const BrokerConnectionStatusSchema = z.enum([
  'active',
  'expired',
  'revoked',
  'failed',
])

export type BrokerConnectionStatus = z.infer<typeof BrokerConnectionStatusSchema>

/**
 * BrokerConnection entity schema
 * 
 * Represents a user's authorized relationship to a broker
 * NO credentials stored - only authorization metadata
 */
export const BrokerConnectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  broker_id: z.string(),
  status: BrokerConnectionStatusSchema,

  // Authorization metadata (NO credentials)
  authorized_at: z.string().datetime(),
  expires_at: z.string().datetime().nullable(),
  last_refresh_at: z.string().datetime().nullable(),

  // Error tracking
  consecutive_failures: z.number().int().min(0),
  last_error_code: z.string().nullable(),
  last_error_message: z.string().nullable(),

  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type BrokerConnection = z.infer<typeof BrokerConnectionSchema>

/**
 * Create broker connection input
 */
export const CreateBrokerConnectionSchema = z.object({
  broker_id: z.string(),
})

export type CreateBrokerConnectionInput = z.infer<typeof CreateBrokerConnectionSchema>
