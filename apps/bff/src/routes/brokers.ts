/**
 * Brokers routes
 *
 * Intent: Handle broker-related operations (listing, connecting, managing connections)
 * Provides endpoints for broker discovery and connection management
 *
 * Contract:
 * - GET /brokers: List supported brokers
 * - POST /brokers/{brokerId}/connect: Initiate broker connection
 * - GET /brokers/connections: List user's broker connections
 * - DELETE /brokers/connections/{connectionId}: Revoke connection
 * - POST /brokers/connections/{connectionId}/refresh: Trigger data refresh
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { createAuthorizationTask } from '../services/authorization.service'
import { createCollectionTask } from '../services/collection.service'
import type { Bindings } from '../index'
import { eq } from 'drizzle-orm'

// Create Hono app for broker routes
const app = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all protected routes
app.use('/connections/*', authMiddleware)
app.use('/connect/*', authMiddleware)
app.use('/refresh/*', authMiddleware)

// GET /brokers - List supported brokers from seed data
app.get('/', async (c) => {
  try {
    // Fetch brokers from the database
    const brokers = await c.env.DB.prepare(
      'SELECT id, name, name_zh, logo_url, supported, adapter_version, requires_verification FROM brokers WHERE supported = 1 ORDER BY name'
    ).all()

    return c.json({
      brokers: brokers.results.map(broker => ({
        id: broker.id,
        name: broker.name,
        name_zh: broker.name_zh,
        logo_url: broker.logo_url,
        supported: broker.supported,
        adapter_version: broker.adapter_version,
        requires_verification: broker.requires_verification,
      }))
    })
  } catch (error) {
    console.error('Error fetching brokers:', error)
    return c.json(
      { error_code: 'FETCH_BROKERS_FAILED', message: 'Failed to fetch supported brokers' },
      500
    )
  }
})

// POST /brokers/{brokerId}/connect - Initiate broker connection
app.post('/:brokerId/connect', async (c) => {
  const { brokerId } = c.req.param()
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Verify that the broker exists and is supported
    const broker = await c.env.DB.prepare(
      'SELECT id FROM brokers WHERE id = ? AND supported = 1'
    ).bind(brokerId).first()

    if (!broker) {
      return c.json(
        { error_code: 'BROKER_NOT_SUPPORTED', message: `Broker ${brokerId} is not supported` },
        400
      )
    }

    // Create an authorization task
    const { taskId, token, status } = await createAuthorizationTask(
      c.env.DB,
      c.env.JWT_SECRET,
      c.env.ENGINE_API_URL,
      {
        userId,
        brokerId,
      }
    )

    return c.json({
      taskId,
      token,
      status,
    })
  } catch (error) {
    console.error(`Error initiating connection for broker ${brokerId}:`, error)
    
    if (error instanceof Error && error.message.includes('Existing')) {
      return c.json(
        { error_code: 'TASK_EXISTS', message: error.message },
        409
      )
    }
    
    return c.json(
      { error_code: 'INITIATE_CONNECTION_FAILED', message: 'Failed to initiate broker connection' },
      500
    )
  }
})

// GET /brokers/connections - List user's broker connections
app.get('/connections', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Fetch user's broker connections
    const connections = await c.env.DB.prepare(
      `
      SELECT 
        bc.id,
        bc.broker_id,
        b.name as broker_name,
        b.name_zh as broker_name_zh,
        b.logo_url,
        bc.status,
        bc.authorized_at,
        bc.expires_at,
        bc.last_refresh_at,
        bc.consecutive_failures,
        bc.last_error_code,
        bc.last_error_message,
        bc.created_at,
        bc.updated_at
      FROM broker_connections bc
      JOIN brokers b ON bc.broker_id = b.id
      WHERE bc.user_id = ?
      ORDER BY bc.created_at DESC
      `
    ).bind(userId).all()

    return c.json({
      connections: connections.results.map(conn => ({
        id: conn.id,
        broker_id: conn.broker_id,
        broker_name: conn.broker_name,
        broker_name_zh: conn.broker_name_zh,
        logo_url: conn.logo_url,
        status: conn.status,
        authorized_at: conn.authorized_at,
        expires_at: conn.expires_at,
        last_refresh_at: conn.last_refresh_at,
        consecutive_failures: conn.consecutive_failures,
        last_error_code: conn.last_error_code,
        last_error_message: conn.last_error_message,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
      }))
    })
  } catch (error) {
    console.error('Error fetching broker connections:', error)
    return c.json(
      { error_code: 'FETCH_CONNECTIONS_FAILED', message: 'Failed to fetch broker connections' },
      500
    )
  }
})

// DELETE /brokers/connections/{connectionId} - Revoke connection
app.delete('/connections/:connectionId', async (c) => {
  const { connectionId } = c.req.param()
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Verify that the connection belongs to the user
    const connection = await c.env.DB.prepare(
      'SELECT id, user_id FROM broker_connections WHERE id = ? AND user_id = ?'
    ).bind(connectionId, userId).first()

    if (!connection) {
      return c.json(
        { error_code: 'CONNECTION_NOT_FOUND', message: 'Broker connection not found or does not belong to user' },
        404
      )
    }

    // Update the connection status to 'revoked'
    await c.env.DB.prepare(
      `
      UPDATE broker_connections 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
      `
    ).bind('revoked', connectionId).run()

    return c.json({
      success: true,
      message: 'Broker connection revoked successfully'
    })
  } catch (error) {
    console.error(`Error revoking connection ${connectionId}:`, error)
    return c.json(
      { error_code: 'REVOKE_CONNECTION_FAILED', message: 'Failed to revoke broker connection' },
      500
    )
  }
})

// POST /brokers/connections/{connectionId}/refresh - Trigger data refresh
app.post('/connections/:connectionId/refresh', async (c) => {
  const { connectionId } = c.req.param()
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Verify that the connection exists and belongs to the user
    const connection = await c.env.DB.prepare(
      'SELECT id, user_id, status FROM broker_connections WHERE id = ? AND user_id = ?'
    ).bind(connectionId, userId).first()

    if (!connection) {
      return c.json(
        { error_code: 'CONNECTION_NOT_FOUND', message: 'Broker connection not found or does not belong to user' },
        404
      )
    }

    // Check if the connection is active
    if (connection.status !== 'active') {
      return c.json(
        { error_code: 'CONNECTION_INACTIVE', message: 'Cannot refresh inactive connection' },
        400
      )
    }

    // Create a collection task
    const { taskId, token, status } = await createCollectionTask(
      c.env.DB,
      c.env.JWT_SECRET,
      c.env.ENGINE_API_URL,
      {
        userId,
        connectionId,
      }
    )

    return c.json({
      taskId,
      token,
      status,
    })
  } catch (error) {
    console.error(`Error triggering refresh for connection ${connectionId}:`, error)
    return c.json(
      { error_code: 'TRIGGER_REFRESH_FAILED', message: 'Failed to trigger portfolio refresh' },
      500
    )
  }
})

export default app