/**
 * Tasks routes
 *
 * Intent: Handle task status polling for authorization and collection tasks
 * Provides endpoints for frontend to check task progress
 *
 * Contract:
 * - GET /tasks/{taskId}: Return task status and details for polling
 */
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import type { Bindings } from '../index'
import { eq } from 'drizzle-orm'

// Create Hono app for task routes
const app = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /tasks/{taskId} - Get task status for polling
app.get('/:taskId', async (c) => {
  const { taskId } = c.req.param()
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // First, try to find the task in authorization_tasks table
    let task = await c.env.DB.prepare(
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
      WHERE id = ? AND user_id = ?
      `
    ).bind(taskId, userId).first()

    if (task) {
      // This is an authorization task
      return c.json({
        id: task.id,
        type: 'authorization',
        status: task.status,
        broker_id: task.broker_id,
        verification_url: task.verification_url,
        verification_type: task.verification_type,
        connection_id: task.connection_id,
        error_code: task.error_code,
        error_message: task.error_message,
        created_at: task.created_at,
        updated_at: task.updated_at,
        expires_at: task.expires_at,
        completed_at: task.completed_at,
      })
    }

    // If not found in authorization_tasks, try collection_tasks
    task = await c.env.DB.prepare(
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
      WHERE id = ? AND user_id = ?
      `
    ).bind(taskId, userId).first()

    if (task) {
      // This is a collection task
      return c.json({
        id: task.id,
        type: 'collection',
        status: task.status,
        connection_id: task.connection_id,
        holdings_collected: task.holdings_collected,
        holdings_failed: task.holdings_failed,
        partial_reason: task.partial_reason,
        error_code: task.error_code,
        error_message: task.error_message,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.completed_at,
      })
    }

    // Task not found
    return c.json(
      { error_code: 'TASK_NOT_FOUND', message: 'Task not found or does not belong to user' },
      404
    )
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error)
    return c.json(
      { error_code: 'FETCH_TASK_FAILED', message: 'Failed to fetch task status' },
      500
    )
  }
})

export default app