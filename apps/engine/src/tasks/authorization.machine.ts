/**
 * Authorization state machine
 *
 * Intent: Manage the state of broker authorization processes
 * Handles the flow from pending to completion, including human-in-the-loop verification
 *
 * Contract:
 * - States: pending → in_progress → [paused | completed | failed]
 * - Handles human verification requirements (captcha, 2FA, consent)
 * - Persists state snapshots for resumability
 */
import { assign, setup } from 'xstate'

// Define the context for the machine
interface AuthorizationContext {
  taskId: string
  userId: string
  brokerId: string
  verificationUrl?: string
  verificationType?: 'captcha' | '2fa' | 'consent'
  error?: {
    code: string
    message: string
  }
  connectionId?: string
}

// Define the events that can trigger state transitions
type AuthorizationEvent =
  | { type: 'START_AUTHORIZATION' }
  | { type: 'AUTHORIZATION_IN_PROGRESS' }
  | { type: 'REQUIRES_VERIFICATION'; verificationUrl: string; verificationType: 'captcha' | '2fa' | 'consent' }
  | { type: 'VERIFICATION_COMPLETED' }
  | { type: 'AUTHORIZATION_COMPLETED'; connectionId: string }
  | { type: 'AUTHORIZATION_FAILED'; errorCode: string; errorMessage: string }
  | { type: 'RESUME_AFTER_VERIFICATION' }

// Define the state machine
export const authorizationMachine = setup({
  types: {} as {
    context: AuthorizationContext
    events: AuthorizationEvent
  },
  actions: {
    setInProgress: assign(() => ({})),
    setVerificationDetails: assign(({ event }) => {
      if (event.type !== 'REQUIRES_VERIFICATION') return {}
      return {
        verificationUrl: event.verificationUrl,
        verificationType: event.verificationType,
      }
    }),
    clearVerification: assign(() => ({
      verificationUrl: undefined,
      verificationType: undefined,
    })),
    setCompleted: assign(({ event }) => {
      if (event.type !== 'AUTHORIZATION_COMPLETED') return {}
      return {
        connectionId: event.connectionId,
      }
    }),
    setFailed: assign(({ event }) => {
      if (event.type !== 'AUTHORIZATION_FAILED') return {}
      return {
        error: {
          code: event.errorCode,
          message: event.errorMessage,
        },
      }
    }),
  },
}).createMachine({
  id: 'authorization',
  initial: 'pending',
  context: {
    taskId: '',
    userId: '',
    brokerId: '',
  },
  states: {
    pending: {
      on: {
        START_AUTHORIZATION: {
          target: 'in_progress',
          actions: 'setInProgress',
        },
      },
    },
    in_progress: {
      on: {
        AUTHORIZATION_IN_PROGRESS: {
          target: 'in_progress',
        },
        REQUIRES_VERIFICATION: {
          target: 'paused',
          actions: ['setVerificationDetails'],
        },
        AUTHORIZATION_COMPLETED: {
          target: 'completed',
          actions: ['setCompleted'],
        },
        AUTHORIZATION_FAILED: {
          target: 'failed',
          actions: ['setFailed'],
        },
      },
    },
    paused: {
      on: {
        RESUME_AFTER_VERIFICATION: {
          target: 'in_progress',
          actions: 'clearVerification',
        },
        AUTHORIZATION_FAILED: {
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
    failed: {
      type: 'final',
      data: {
        status: 'failed',
      },
    },
  },
})

// Export type for the machine
export type AuthorizationMachine = typeof authorizationMachine
