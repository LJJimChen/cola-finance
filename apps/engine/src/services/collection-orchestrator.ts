/**
 * Collection orchestration service
 *
 * Intent: Coordinate the execution of collection tasks using state machines and broker adapters
 * Manages the entire data collection workflow from initiation to completion
 *
 * Contract:
 * - Executes collection state machine
 * - Coordinates with broker adapters
 * - Updates task status in database
 * - Persists holdings data via BFF callback or direct DB write
 */
import { createActor } from 'xstate'
import { collectionMachine } from '../tasks/collection.machine'
import { createBrokerAdapter } from '../brokers/adapter.factory'
import { chromium, type Page } from 'playwright'
import type { Holding } from '@cola-finance/schema'

// Define input for executing a collection task
interface ExecuteCollectionTaskInput {
  taskId: string
  userId: string
  connectionId: string
}

// Define the result of a collection task
interface CollectionTaskResult {
  status: string
  holdingsCollected: number
  holdingsFailed: number
  partialReason?: string
  errorCode?: string
  errorMessage?: string
}

// Define the collection task data structure
interface CollectionTaskData {
  id: string
  userId: string
  connectionId: string
  status: string
  stateSnapshot: string
  holdingsCollected: number
  holdingsFailed: number
  partialReason?: string
  errorCode?: string
  errorMessage?: string
}

export class CollectionOrchestrator {
  /**
   * Execute a collection task
   *
   * Input: Task details (taskId, userId, connectionId)
   * Output: Collection task result
   * Side effects: Updates task status in database, retrieves holdings data from broker, persists holdings
   */
  async executeCollectionTask(input: ExecuteCollectionTaskInput): Promise<CollectionTaskResult> {
    const { taskId, userId, connectionId } = input

    try {
      // Fetch the current task state from the database
      const taskData = await this.getTaskFromDatabase(taskId)
      
      if (!taskData) {
        throw new Error(`Collection task ${taskId} not found`)
      }

      // Create a browser context for this task
      const browser = await chromium.launch({ headless: true })
      const context = await browser.newContext()
      const page: Page = await context.newPage()

      try {
        // Determine the brokerId from the connectionId
        // In a real implementation, we'd fetch this from the database
        const brokerId = await this.getBrokerIdFromConnection(connectionId)

        // Create the broker adapter for the specified broker
        const adapter = createBrokerAdapter(brokerId, page)

        // Restore the state machine from the snapshot if it exists
        let restoredMachine = collectionMachine
        if (taskData.stateSnapshot) {
          // In a real implementation, we would restore the machine state from the snapshot
          console.log(`Restoring state for collection task ${taskId}`)
        }

        const service = createActor(restoredMachine)
        service.start()

        const collectionResult = await adapter.collectHoldings(connectionId)

        const holdingsCollected = collectionResult.holdings.length
        const holdingsFailed = collectionResult.failed_holdings.length

        // Update progress as holdings are collected
        service.send({
          type: 'COLLECTION_IN_PROGRESS',
          holdingsCollected,
          holdingsFailed,
        })

        const progressSnapshot = service.getSnapshot()

        await this.updateTaskInDatabase(taskId, {
          status: 'in_progress',
          holdingsCollected,
          holdingsFailed,
          stateSnapshot: JSON.stringify({ value: progressSnapshot.value, context: progressSnapshot.context }),
        })

        if (!collectionResult.partial && holdingsFailed === 0) {
          await this.persistHoldings(userId, connectionId, collectionResult.holdings)

          service.send({
            type: 'COLLECTION_COMPLETED',
            holdingsCollected,
          })

          const snapshot = service.getSnapshot()

          await this.updateTaskInDatabase(taskId, {
            status: 'completed',
            holdingsCollected,
            holdingsFailed,
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'completed',
            holdingsCollected,
            holdingsFailed,
          }
        }

        if (collectionResult.partial) {
          await this.persistHoldings(userId, connectionId, collectionResult.holdings)

          service.send({
            type: 'COLLECTION_PARTIAL',
            holdingsCollected,
            holdingsFailed,
            partialReason: 'Some holdings failed to collect',
          })

          const snapshot = service.getSnapshot()

          await this.updateTaskInDatabase(taskId, {
            status: 'partial',
            holdingsCollected,
            holdingsFailed,
            partialReason: 'Some holdings failed to collect',
            stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
          })

          return {
            status: 'partial',
            holdingsCollected,
            holdingsFailed,
            partialReason: 'Some holdings failed to collect',
          }
        }

        const firstError = collectionResult.failed_holdings[0]
        const errorCode = firstError?.error_code ?? 'COLLECTION_ERROR'
        const errorMessage = firstError?.error_message ?? 'Collection failed'

        service.send({
          type: 'COLLECTION_FAILED',
          errorCode,
          errorMessage,
        })

        const snapshot = service.getSnapshot()

        await this.updateTaskInDatabase(taskId, {
          status: 'failed',
          holdingsCollected,
          holdingsFailed,
          errorCode,
          errorMessage,
          stateSnapshot: JSON.stringify({ value: snapshot.value, context: snapshot.context }),
        })

        return {
          status: 'failed',
          holdingsCollected,
          holdingsFailed,
          errorCode,
          errorMessage,
        }
      } finally {
        // Close the browser regardless of success or failure
        await browser.close()
      }
    } catch (error) {
      console.error(`Error executing collection task ${taskId}:`, error)

      // Update the task to failed status
      await this.updateTaskInDatabase(taskId, {
        status: 'failed',
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during execution',
        holdingsCollected: 0,
        holdingsFailed: 0
      })

      return {
        status: 'failed',
        holdingsCollected: 0,
        holdingsFailed: 0,
        errorCode: 'EXECUTION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during execution'
      }
    }
  }

  /**
   * Helper method to fetch task from database
   * In a real implementation, this would query the database
   */
  private async getTaskFromDatabase(taskId: string): Promise<CollectionTaskData | null> {
    // This is a placeholder implementation
    // In a real implementation, this would query the database
    console.log(`Fetching collection task ${taskId} from database`)
    return {
      id: taskId,
      userId: 'user123',
      connectionId: 'conn123',
      status: 'pending',
      stateSnapshot: '{}',
      holdingsCollected: 0,
      holdingsFailed: 0
    }
  }

  /**
   * Helper method to update task in database
   * In a real implementation, this would update the database
   */
  private async updateTaskInDatabase(taskId: string, updates: Partial<CollectionTaskData>): Promise<void> {
    // This is a placeholder implementation
    // In a real implementation, this would update the database
    console.log(`Updating collection task ${taskId} in database with:`, updates)
  }

  /**
   * Helper method to get brokerId from connectionId
   * In a real implementation, this would query the database
   */
  private async getBrokerIdFromConnection(connectionId: string): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, this would query the database to get the brokerId
    console.log(`Getting brokerId for connection ${connectionId}`)
    return 'futu' // Return a default broker for the example
  }

  /**
   * Helper method to persist holdings to the database
   * Could be via BFF API call or direct DB write depending on configuration
   */
  private async persistHoldings(userId: string, connectionId: string, holdings: Holding[]): Promise<void> {
    // In a real implementation, we would either:
    // 1. Call the BFF API to persist holdings
    // 2. Or write directly to the database if the engine has access
    
    console.log(`Persisting ${holdings.length} holdings for user ${userId} and connection ${connectionId}`)
    
    // Example of calling BFF API:
    /*
    const response = await fetch(`${process.env.BFF_API_URL}/api/holdings/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ENGINE_TO_BFF_TOKEN}`
      },
      body: JSON.stringify({
        userId,
        connectionId,
        holdings
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to persist holdings via BFF API: ${response.statusText}`)
    }
    */
    
    // For now, just log the holdings that would be persisted
    holdings.forEach(holding => {
      console.log(`Would persist holding: ${holding.symbol} - ${holding.marketValue} ${holding.currency}`)
    })
  }
}

// Export a singleton instance
export const collectionOrchestrator = new CollectionOrchestrator()
