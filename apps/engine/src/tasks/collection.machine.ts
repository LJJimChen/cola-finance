/**
 * Collection state machine
 *
 * Intent: Manage the state of portfolio data collection processes
 * Handles the flow from pending to completion, including partial success scenarios
 *
 * Contract:
 * - States: pending → in_progress → [completed | partial | failed]
 * - Tracks holdings collected and failed counts
 * - Handles partial collection scenarios
 */
import { createMachine, assign } from 'xstate'
import type { CollectionTaskStatus } from '../../../../schema/src/tasks/collection-task'

// Define the context for the machine
interface CollectionContext {
  taskId: string
  userId: string
  connectionId: string
  holdingsCollected: number
  holdingsFailed: number
  partialReason?: string
  error?: {
    code: string
    message: string
  }
}

// Define the events that can trigger state transitions
type CollectionEvent =
  | { type: 'START_COLLECTION' }
  | { type: 'COLLECTION_IN_PROGRESS'; holdingsCollected?: number; holdingsFailed?: number }
  | { type: 'COLLECTION_COMPLETED'; holdingsCollected: number }
  | { type: 'COLLECTION_PARTIAL'; holdingsCollected: number; holdingsFailed: number; partialReason: string }
  | { type: 'COLLECTION_FAILED'; errorCode: string; errorMessage: string }

// Define the state machine
export const collectionMachine = createMachine<CollectionContext, CollectionEvent>({
  id: 'collection',
  initial: 'pending',
  context: {
    taskId: '',
    userId: '',
    connectionId: '',
    holdingsCollected: 0,
    holdingsFailed: 0,
  },
  states: {
    pending: {
      on: {
        START_COLLECTION: {
          target: 'in_progress',
          actions: 'setInProgress',
        },
      },
    },
    in_progress: {
      on: {
        COLLECTION_IN_PROGRESS: {
          target: 'in_progress',
          actions: 'updateProgress',
        },
        COLLECTION_COMPLETED: {
          target: 'completed',
          actions: ['setCompleted'],
        },
        COLLECTION_PARTIAL: {
          target: 'partial',
          actions: ['setPartial'],
        },
        COLLECTION_FAILED: {
          target: 'failed',
          actions: ['setFailed'],
        },
      },
    },
    completed: {
      type: 'final',
      data: {
        status: 'completed',
      },
    },
    partial: {
      type: 'final',
      data: {
        status: 'partial',
      },
    },
    failed: {
      type: 'final',
      data: {
        status: 'failed',
      },
    },
  },
}, {
  actions: {
    setInProgress: assign({
      // This action is called when transitioning to in_progress
    }),
    updateProgress: assign((context, event) => {
      if (event.type === 'COLLECTION_IN_PROGRESS') {
        return {
          ...context,
          holdingsCollected: event.holdingsCollected ?? context.holdingsCollected,
          holdingsFailed: event.holdingsFailed ?? context.holdingsFailed,
        }
      }
      return context
    }),
    setCompleted: assign((context, event) => {
      if (event.type === 'COLLECTION_COMPLETED') {
        return {
          ...context,
          holdingsCollected: event.holdingsCollected,
        }
      }
      return context
    }),
    setPartial: assign((context, event) => {
      if (event.type === 'COLLECTION_PARTIAL') {
        return {
          ...context,
          holdingsCollected: event.holdingsCollected,
          holdingsFailed: event.holdingsFailed,
          partialReason: event.partialReason,
        }
      }
      return context
    }),
    setFailed: assign((context, event) => {
      if (event.type === 'COLLECTION_FAILED') {
        return {
          ...context,
          error: {
            code: event.errorCode,
            message: event.errorMessage,
          },
        }
      }
      return context
    }),
  },
})

// Export type for the machine
export type CollectionMachine = typeof collectionMachine