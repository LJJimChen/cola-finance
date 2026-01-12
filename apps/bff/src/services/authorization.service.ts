/**
 * Authorization service
 *
 * Intent: Handle broker authorization tasks including creation and communication with Engine
 * Manages the lifecycle of broker authorization processes
 *
 * Contract:
 * - Creates authorization tasks in database
 * - Generates delegation tokens for Engine access
 * - Calls Engine API to initiate authorization process
 * - Returns task information to frontend for polling
 */
import { eq, and } from 'drizzle-orm'
import { ulid } from 'ulidx'
import { generateDelegationToken } from '../lib/jwt'
import { authorizationTasks } from '../db/schema/authorization-tasks'
import type { D1Database } from '@cloudflare/workers-types'
import type { AuthorizationTaskStatus } from '../../../schema/src/tasks/authorization-task'

/**
 * Input for creating an authorization task
 */
interface CreateAuthorizationTaskInput {
  userId: string
  brokerId: string
}

/**
 * Response from creating an authorization task
 */
interface CreateAuthorizationTaskResponse {
  taskId: string
  token: string
  status: AuthorizationTaskStatus
}

/**
 * Create a new authorization task
 *
 * Intent: Initialize a broker authorization process
 * Creates a task record in the database and prepares for Engine communication
 *
 * Input: User ID, broker ID, JWT secret, Engine API URL
 * Output: Task ID, delegation token, initial status
 * Side effects: Inserts authorization task record into database
 */
export async function createAuthorizationTask(
  db: D1Database,
  jwtSecret: string,
  engineApiUrl: string,
  input: CreateAuthorizationTaskInput
): Promise<CreateAuthorizationTaskResponse> {
  const { userId, brokerId } = input

  // Check if there's already a pending or in-progress task for this user/broker combination
  const existingTask = await db
    .prepare(
      'SELECT id, status FROM authorization_tasks WHERE user_id = ? AND broker_id = ? AND status IN (?, ?, ?)'
    )
    .bind(userId, brokerId, 'pending', 'in_progress', 'paused')
    .all()

  if (existingTask.results.length > 0) {
    throw new Error(`Existing ${existingTask.results[0].status} task for broker ${brokerId}`)
  }

  // Generate a new task ID
  const taskId = ulid()

  // Prepare the initial state for the xstate state machine
  const initialState = {
    value: 'pending',
    context: {
      userId,
      brokerId,
      taskId,
    },
  }

  // Insert the authorization task into the database
  await db
    .prepare(
      `
      INSERT INTO authorization_tasks (
        id,
        user_id,
        broker_id,
        status,
        state_snapshot,
        created_at,
        updated_at,
        expires_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, datetime(CURRENT_TIMESTAMP, '+1 hour'))
      `
    )
    .bind(
      taskId,
      userId,
      brokerId,
      'pending',
      JSON.stringify(initialState)
    )
    .run()

  // Generate a delegation token for the Engine to use
  const token = await generateDelegationToken(
    userId,
    taskId,
    'broker_authorization',
    jwtSecret,
    brokerId
  )

  // Call the engine to start the authorization process
  await callEngineForAuthorization(taskId, token, brokerId, engineApiUrl)

  return {
    taskId,
    token,
    status: 'pending',
  }
}

/**
 * Get authorization task by ID
 *
 * Intent: Retrieve task information for frontend polling
 *
 * Input: Task ID
 * Output: Authorization task details
 * Side effects: None
 */
export async function getAuthorizationTask(
  db: D1Database,
  taskId: string
) {
  const result = await db
    .prepare(
      `
      SELECT 
        id,
        user_id,
        broker_id,
        status,
        verification_url,
        verification_type,
        connection_id,
        error_code,
        error_message,
        created_at,
        updated_at,
        expires_at,
        completed_at
      FROM authorization_tasks 
      WHERE id = ?
      `
    )
    .bind(taskId)
    .first()

  return result
}

/**
 * Call Engine to start authorization
 *
 * Intent: Communicate with Engine service to begin broker authorization process
 *
 * Input: Task ID, delegation token, broker ID, environment variables
 * Output: Engine response
 * Side effects: Initiates browser automation on Engine
 */
export async function callEngineForAuthorization(
  taskId: string,
  token: string,
  brokerId: string,
  engineApiUrl: string
): Promise<any> {
  try {
    const response = await fetch(`${engineApiUrl}/authorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        taskId,
        brokerId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Engine authorization request failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Failed to call Engine for authorization task ${taskId}:`, error)
    throw error
  }
}