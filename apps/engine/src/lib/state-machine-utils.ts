/**
 * xstate state machine utilities
 * 
 * Intent: Provide utilities for state machine persistence and error handling
 * Ensures all state transitions are explicit and recoverable
 * 
 * Contract:
 * - State snapshots persisted to database (via BFF API)
 * - All errors logged with context
 * - State machines are deterministic and testable
 */

/**
 * Serialize state machine snapshot to JSON
 * 
 * Intent: Convert xstate snapshot to storable JSON string
 * Used to persist state in database (authorization_tasks, collection_tasks tables)
 * 
 * Input: xstate snapshot-like object
 * Output: JSON string
 * Side effects: None
 */
export function serializeSnapshot(snapshot: unknown): string {
  return JSON.stringify(snapshot)
}

/**
 * Deserialize state machine snapshot from JSON
 * 
 * Intent: Restore xstate snapshot from database
 * Used to resume tasks after pause or server restart
 * 
 * Input: JSON string
 * Output: Parsed snapshot object
 * Side effects: None
 */
export function deserializeSnapshot(serialized: string): unknown | null {
  try {
    return JSON.parse(serialized)
  } catch (error) {
    console.error('Failed to deserialize snapshot:', error)
    return null
  }
}

/**
 * Check if state is terminal (completed, failed, expired)
 * 
 * Intent: Determine if task has reached final state
 * 
 * Input: State value (string or object)
 * Output: Boolean
 * Side effects: None
 */
export function isTerminalState(stateValue: string | Record<string, unknown>): boolean {
  const terminalStates = ['completed', 'failed', 'expired']

  if (typeof stateValue === 'string') {
    return terminalStates.includes(stateValue)
  }

  // Handle nested states
  const stateKey = Object.keys(stateValue)[0]
  return stateKey ? terminalStates.includes(stateKey) : false
}

/**
 * Extract error information from state context
 * 
 * Intent: Get error details from failed state
 * 
 * Input: Snapshot-like object with context
 * Output: Error code and message (if present)
 * Side effects: None
 */
export function extractError(snapshot: Record<string, unknown>): {
  error_code: string | null
  error_message: string | null
} {
  const context = (snapshot.context as Record<string, unknown>) || {}

  return {
    error_code: (context.error_code as string) || null,
    error_message: (context.error_message as string) || null,
  }
}

/**
 * Log state transition with context
 * 
 * Intent: Structured logging for debugging state machines
 * Constitution: All errors must carry actionable context
 * 
 * Input: Task ID, from state, to state, context
 * Output: None
 * Side effects: Console log
 */
export function logStateTransition(
  taskId: string,
  fromState: string | Record<string, unknown>,
  toState: string | Record<string, unknown>,
  context?: Record<string, unknown>
) {
  console.log('State transition:', {
    task_id: taskId,
    from: fromState,
    to: toState,
    context: context || {},
    timestamp: new Date().toISOString(),
  })
}
