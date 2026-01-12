/**
 * Collection service
 *
 * Intent: Handle portfolio data collection tasks including creation and communication with Engine
 * Manages the lifecycle of data collection processes from broker connections
 *
 * Contract:
 * - Creates collection tasks in database
 * - Generates delegation tokens for Engine access
 * - Calls Engine API to initiate data collection process
 * - Returns task information to frontend for polling
 */
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulidx'
import { generateDelegationToken } from '../lib/jwt'
import { collectionTasks } from '../db/schema/collection-tasks'
import type { D1Database } from '@cloudflare/workers-types'
import type { CollectionTaskStatus } from '../../../schema/src/tasks/collection-task'

/**
 * Input for creating a collection task
 */
interface CreateCollectionTaskInput {
  userId: string
  connectionId: string
}

/**
 * Response from creating a collection task
 */
interface CreateCollectionTaskResponse {
  taskId: string
  token: string
  status: CollectionTaskStatus
}

/**
 * Create a new collection task
 *
 * Intent: Initialize a portfolio data collection process
 * Creates a task record in the database and prepares for Engine communication
 *
 * Input: User ID, connection ID, JWT secret, Engine API URL
 * Output: Task ID, delegation token, initial status
 * Side effects: Inserts collection task record into database
 */
export async function createCollectionTask(
  db: D1Database,
  jwtSecret: string,
  engineApiUrl: string,
  input: CreateCollectionTaskInput
): Promise<CreateCollectionTaskResponse> {
  const { userId, connectionId } = input

  // Generate a new task ID
  const taskId = ulid()

  // Prepare the initial state for the xstate state machine
  const initialState = {
    value: 'pending',
    context: {
      userId,
      connectionId,
      taskId,
    },
  }

  // Insert the collection task into the database
  await db
    .prepare(
      `
      INSERT INTO collection_tasks (
        id, 
        user_id, 
        connection_id, 
        status, 
        state_snapshot,
        holdings_collected,
        holdings_failed,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .bind(
      taskId,
      userId,
      connectionId,
      'pending',
      JSON.stringify(initialState)
    )
    .run()

  // Generate a delegation token for the Engine to use
  const token = await generateDelegationToken(
    userId,
    taskId,
    'data_collection',
    jwtSecret
  )

  // Call the engine to start the collection process
  await callEngineForCollection(taskId, token, connectionId, engineApiUrl)

  return {
    taskId,
    token,
    status: 'pending',
  }
}

/**
 * Get collection task by ID
 *
 * Intent: Retrieve task information for frontend polling
 *
 * Input: Task ID
 * Output: Collection task details
 * Side effects: None
 */
export async function getCollectionTask(
  db: D1Database,
  taskId: string
) {
  const result = await db
    .prepare(
      `
      SELECT 
        id,
        user_id,
        connection_id,
        status,
        holdings_collected,
        holdings_failed,
        partial_reason,
        error_code,
        error_message,
        created_at,
        updated_at,
        completed_at
      FROM collection_tasks 
      WHERE id = ?
      `
    )
    .bind(taskId)
    .first()

  return result
}

/**
 * Call Engine to start collection
 *
 * Intent: Communicate with Engine service to begin data collection process
 *
 * Input: Task ID, delegation token, connection ID, environment variables
 * Output: Engine response
 * Side effects: Initiates data collection on Engine
 */
export async function callEngineForCollection(
  taskId: string,
  token: string,
  connectionId: string,
  engineApiUrl: string
): Promise<any> {
  try {
    const response = await fetch(`${engineApiUrl}/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskId,
        connectionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Engine collection request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to call Engine for collection task ${taskId}:`, error)
    throw error
  }
}