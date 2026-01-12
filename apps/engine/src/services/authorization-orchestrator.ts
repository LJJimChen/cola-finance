/**
 * Authorization orchestration service
 *
 * Intent: Coordinate the execution of authorization tasks using state machines and broker adapters
 * Manages the entire authorization workflow from initiation to completion
 *
 * Contract:
 * - Executes authorization state machine
 * - Coordinates with broker adapters
 * - Updates task status in database
 * - Handles human-in-the-loop verification requirements
 */
import { createActor } from 'xstate'
import { authorizationMachine } from '../tasks/authorization.machine'
import { createBrokerAdapter } from '../brokers/adapter.factory'
import { ulid } from 'ulidx'
import { chromium, type Page } from 'playwright'

// Define input for executing an authorization task
interface ExecuteAuthorizationTaskInput {
  taskId: string
  userId: string
  brokerId: string
}

// Define input for resuming an authorization task
interface ResumeAuthorizationTaskInput {
  taskId: string
  userId: string
}

// Define the result of an authorization task
interface AuthorizationTaskResult {
  status: string
  verificationUrl?: string
  verificationType?: 'captcha' | '2fa' | 'consent'
  connectionId?: string
  errorCode?: string
  errorMessage?: string
}

// Define the authorization task data structure
interface AuthorizationTaskData {
  id: string
  userId: string
  brokerId: string
  status: string
  stateSnapshot: string
  verificationUrl?: string
  verificationType?: string
  connectionId?: string
  errorCode?: string
  errorMessage?: string
}

export class AuthorizationOrchestrator {
  /**
   * Execute an authorization task
   *
   * Input: Task details (taskId, userId, brokerId)
   * Output: Authorization task result
   * Side effects: Updates task status in database, interacts with broker via browser automation
   */
  async executeAuthorizationTask(input: ExecuteAuthorizationTaskInput): Promise<AuthorizationTaskResult> {
    const { taskId, userId, brokerId } = input

    try {
      // Fetch the current task state from the database
      const taskData = await this.getTaskFromDatabase(taskId)
      
      if (!taskData) {
        throw new Error(`Authorization task ${taskId} not found`)
      }

      // Create a browser context for this task
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext()
      const page: Page = await context.newPage()

      try {
        // Create the broker adapter for the specified broker
        const adapter = createBrokerAdapter(brokerId, page)

        // Restore the state machine from the snapshot if it exists
        let restoredMachine = authorizationMachine
        if (taskData.stateSnapshot) {
          // In a real implementation, we would restore the machine state from the snapshot
          // For now, we'll just log that we're restoring
          console.log(`Restoring state for task ${taskId}`)
        }

        const service = createActor(restoredMachine)
        service.start()

        const authResult = await adapter.authorize()

        // Based on the result, transition the state machine
        if (authResult.status === 'needs_verification') {
          // Transition to paused state
          service.send({
            type: 'REQUIRES_VERIFICATION',
            verificationUrl: authResult.verification_url,
            verificationType: authResult.verification_type,
          })

          const snapshot = service.getSnapshot()

          // Update the task in the database
          await this.updateTaskInDatabase(taskId, {
            status: 'paused',
            verificationUrl: authResult.verification_url,
            verificationType: authResult.verification_type,
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'paused',
            verificationUrl: authResult.verification_url,
            verificationType: authResult.verification_type,
          }
        } else if (authResult.status === 'success') {
          // Create a new broker connection record
          const connectionId = await this.createBrokerConnection(userId, brokerId)

          // Transition to completed state
          service.send({
            type: 'AUTHORIZATION_COMPLETED',
            connectionId,
          })

          const snapshot = service.getSnapshot()

          // Update the task in the database
          await this.updateTaskInDatabase(taskId, {
            status: 'completed',
            connectionId,
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'completed',
            connectionId,
          }
        } else {
          // Transition to failed state
          service.send({
            type: 'AUTHORIZATION_FAILED',
            errorCode: authResult.error_code || 'AUTHORIZATION_ERROR',
            errorMessage: authResult.error_message || 'Authorization failed',
          })

          const snapshot = service.getSnapshot()

          // Update the task in the database
          await this.updateTaskInDatabase(taskId, {
            status: 'failed',
            errorCode: authResult.error_code || 'AUTHORIZATION_ERROR',
            errorMessage: authResult.error_message || 'Authorization failed',
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'failed',
            errorCode: authResult.error_code || 'AUTHORIZATION_ERROR',
            errorMessage: authResult.error_message || 'Authorization failed',
          }
        }
      } finally {
        // Close the browser regardless of success or failure
        await browser.close()
      }
    } catch (error) {
      console.error(`Error executing authorization task ${taskId}:`, error)

      // Update the task to failed status
      await this.updateTaskInDatabase(taskId, {
        status: 'failed',
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during execution',
      })

      return {
        status: 'failed',
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during execution',
      }
    }
  }

  /**
   * Resume a paused authorization task after user verification
   *
   * Input: Task details (taskId, userId)
   * Output: Authorization task result
   * Side effects: Updates task status in database, continues authorization process
   */
  async resumeAuthorizationTask(input: ResumeAuthorizationTaskInput): Promise<AuthorizationTaskResult> {
    const { taskId, userId } = input

    try {
      // Fetch the current task state from the database
      const taskData = await this.getTaskFromDatabase(taskId)
      
      if (!taskData) {
        throw new Error(`Authorization task ${taskId} not found`)
      }

      if (taskData.status !== 'paused') {
        throw new Error(`Cannot resume task ${taskId} with status ${taskData.status}`)
      }

      // Create a browser context for this task
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext()
      const page: Page = await context.newPage()

      try {
        // Create the broker adapter for the broker in the task
        const adapter = createBrokerAdapter(taskData.brokerId, page)

        // Restore the state machine from the snapshot
        let restoredMachine = authorizationMachine
        if (taskData.stateSnapshot) {
          // In a real implementation, we would restore the machine state from the snapshot
          console.log(`Restoring state for task ${taskId}`)
        }

        const service = createActor(restoredMachine)
        service.start()

        // Resume the authorization process with the adapter
        const resumeResult = await adapter.completeAuthorization()

        // Transition to in-progress state first
        service.send({ type: 'RESUME_AFTER_VERIFICATION' })

        if (resumeResult.status === 'success') {
          // Create a new broker connection record
          const connectionId = await this.createBrokerConnection(userId, taskData.brokerId)

          // Transition to completed state
          service.send({
            type: 'AUTHORIZATION_COMPLETED',
            connectionId,
          })

          const snapshot = service.getSnapshot()

          // Update the task in the database
          await this.updateTaskInDatabase(taskId, {
            status: 'completed',
            connectionId,
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'completed',
            connectionId,
          }
        } else {
          // Transition to failed state
          service.send({
            type: 'AUTHORIZATION_FAILED',
            errorCode: resumeResult.error_code || 'RESUME_ERROR',
            errorMessage: resumeResult.error_message || 'Resume authorization failed',
          })

          const snapshot = service.getSnapshot()

          // Update the task in the database
          await this.updateTaskInDatabase(taskId, {
            status: 'failed',
            errorCode: resumeResult.error_code || 'RESUME_ERROR',
            errorMessage: resumeResult.error_message || 'Resume authorization failed',
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'failed',
            errorCode: resumeResult.error_code || 'RESUME_ERROR',
            errorMessage: resumeResult.error_message || 'Resume authorization failed',
          }
        }
      } finally {
        // Close the browser regardless of success or failure
        await browser.close()
      }
    } catch (error) {
      console.error(`Error resuming authorization task ${taskId}:`, error)

      // Update the task to failed status
      await this.updateTaskInDatabase(taskId, {
        status: 'failed',
        errorCode: 'RESUME_EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during resume execution',
      })

      return {
        status: 'failed',
        errorCode: 'RESUME_EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during resume execution',
      }
    }
  }

  /**
   * Helper method to fetch task from database
   * In a real implementation, this would query the database
   */
  private async getTaskFromDatabase(taskId: string): Promise<AuthorizationTaskData | null> {
    // This is a placeholder implementation
    // In a real implementation, this would query the database
    console.log(`Fetching task ${taskId} from database`)
    return {
      id: taskId,
      userId: 'user123',
      brokerId: 'futu',
      status: 'pending',
      stateSnapshot: '{}'
    }
  }

  /**
   * Helper method to update task in database
   * In a real implementation, this would update the database
   */
  private async updateTaskInDatabase(taskId: string, updates: Partial<AuthorizationTaskData>): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, this would update the database
    console.log(`Updating task ${taskId} in database with:`, updates)
  }

  /**
   * Helper method to create a broker connection in the database
   * In a real implementation, this would insert a record in the database
   */
  private async createBrokerConnection(userId: string, brokerId: string): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, this would insert a record in the database
    console.log(`Creating broker connection for user ${userId} and broker ${brokerId}`)
    return ulid() // Return a unique ID for the connection
  }
}

// Export a singleton instance
export const authorizationOrchestrator = new AuthorizationOrchestrator()
