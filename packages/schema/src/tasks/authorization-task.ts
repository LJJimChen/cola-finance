/**
 * Authorization task type definitions
 * 
 * Intent: Define AuthorizationTask state and transitions
 * Used for establishing/renewing broker connections with human-in-the-loop support
 * 
 * Contract:
 * - Task represents a user-visible authorization process
 * - State machine managed by xstate (state_snapshot field)
 * - Supports paused state for human verification (captcha, 2FA)
 * - 5-minute token lifetime for Engine access
 * - 1-hour task expiration from creation
 */
import { z } from 'zod'

/**
 * Authorization task status
 * 
 * State transitions:
 * pending → in_progress → (paused →) completed/failed/expired
 */
export const AuthorizationTaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'paused',
  'completed',
  'failed',
  'expired',
])

export type AuthorizationTaskStatus = z.infer<typeof AuthorizationTaskStatusSchema>

/**
 * Verification type for human-in-the-loop flows
 */
export const VerificationTypeSchema = z.enum(['captcha', '2fa', 'consent'])

export type VerificationType = z.infer<typeof VerificationTypeSchema>

/**
 * AuthorizationTask entity schema
 * 
 * Represents broker authorization process with human-in-the-loop support
 */
export const AuthorizationTaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  broker_id: z.string(),
  status: AuthorizationTaskStatusSchema,

  // xstate state machine snapshot (JSON-serialized)
  state_snapshot: z.string(),

  // Human-in-the-loop fields
  verification_url: z.string().url().nullable(),
  verification_type: VerificationTypeSchema.nullable(),

  // Result fields
  connection_id: z.string().uuid().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  expires_at: z.string().datetime(), // Task expires 1 hour after creation
  completed_at: z.string().datetime().nullable(),
})

export type AuthorizationTask = z.infer<typeof AuthorizationTaskSchema>

/**
 * Create authorization task input
 */
export const CreateAuthorizationTaskSchema = z.object({
  broker_id: z.string(),
})

export type CreateAuthorizationTaskInput = z.infer<typeof CreateAuthorizationTaskSchema>

/**
 * Resume authorization task input (after user verification)
 */
export const ResumeAuthorizationTaskSchema = z.object({
  task_id: z.string().uuid(),
})

export type ResumeAuthorizationTaskInput = z.infer<typeof ResumeAuthorizationTaskSchema>

/**
 * Authorization task response (for polling)
 */
export const AuthorizationTaskResponseSchema = z.object({
  id: z.string().uuid(),
  status: AuthorizationTaskStatusSchema,
  verification_url: z.string().url().nullable(),
  verification_type: VerificationTypeSchema.nullable(),
  connection_id: z.string().uuid().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
})

export type AuthorizationTaskResponse = z.infer<typeof AuthorizationTaskResponseSchema>
