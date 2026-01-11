/**
 * Collection task type definitions
 * 
 * Intent: Define CollectionTask state and transitions
 * Used for refreshing holdings/performance data from broker connections
 * 
 * Contract:
 * - Task represents a data collection process
 * - State machine managed by xstate (state_snapshot field)
 * - Supports partial success (some holdings collected, others failed)
 * - Tracks holdings_collected and holdings_failed counts
 */
import { z } from 'zod'

/**
 * Collection task status
 * 
 * State transitions:
 * pending → in_progress → completed/failed/partial
 */
export const CollectionTaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'partial',
])

export type CollectionTaskStatus = z.infer<typeof CollectionTaskStatusSchema>

/**
 * CollectionTask entity schema
 * 
 * Represents holdings data collection from a broker connection
 */
export const CollectionTaskSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  connection_id: z.string().uuid(),
  status: CollectionTaskStatusSchema,

  // xstate state machine snapshot (JSON-serialized)
  state_snapshot: z.string(),

  // Result metadata
  holdings_collected: z.number().int().min(0),
  holdings_failed: z.number().int().min(0),
  partial_reason: z.string().nullable(),

  // Error tracking
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
})

export type CollectionTask = z.infer<typeof CollectionTaskSchema>

/**
 * Create collection task input
 */
export const CreateCollectionTaskSchema = z.object({
  connection_id: z.string().uuid(),
})

export type CreateCollectionTaskInput = z.infer<typeof CreateCollectionTaskSchema>

/**
 * Collection task response (for polling)
 */
export const CollectionTaskResponseSchema = z.object({
  id: z.string().uuid(),
  status: CollectionTaskStatusSchema,
  holdings_collected: z.number().int(),
  holdings_failed: z.number().int(),
  partial_reason: z.string().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
})

export type CollectionTaskResponse = z.infer<typeof CollectionTaskResponseSchema>
