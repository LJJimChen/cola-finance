/**
 * Authorization routes
 *
 * Intent: Handle broker authorization requests from BFF
 * Executes authorization state machine and manages human-in-the-loop verification
 *
 * Contract:
 * - POST /authorize: Start authorization process
 * - POST /authorize/{taskId}/resume: Resume paused authorization after user verification
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { verifyJWT, DelegationTokenPayload } from '../../lib/jwt'
import { authorizationOrchestrator } from '../../services/authorization-orchestrator'

// Define route schemas
const authorizeSchema = {
  body: z.object({
    taskId: z.string(),
    brokerId: z.string(),
  }),
  headers: z.object({
    authorization: z.string(),
  }),
}

const resumeSchema = {
  params: z.object({
    taskId: z.string(),
  }),
  headers: z.object({
    authorization: z.string(),
  }),
}

export async function authorizationRoutes(fastify: FastifyInstance) {
  /**
   * POST /authorize
   * Start the authorization process for a broker
   */
  fastify.post(
    '/authorize',
    { schema: authorizeSchema },
    async (request: FastifyRequest<{ Body: { taskId: string; brokerId: string }; Headers: { authorization: string } }>, reply: FastifyReply) => {
      try {
        // Extract and verify the delegation token
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.code(401).send({
            error_code: 'UNAUTHORIZED',
            message: 'Missing or invalid token'
          })
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
          request.log.error('JWT_SECRET not configured')
          return reply.code(500).send({
            error_code: 'SERVER_ERROR',
            message: 'Server configuration error'
          })
        }

        const payload = await verifyJWT<DelegationTokenPayload>(token, jwtSecret)
        if (!payload) {
          return reply.code(401).send({
            error_code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          })
        }

        // Verify token is for authorization task
        if (payload.task_type !== 'broker_authorization') {
          return reply.code(403).send({
            error_code: 'FORBIDDEN',
            message: 'Token not valid for authorization task'
          })
        }

        // Extract required data from payload
        const { task_id: taskId, sub: userId, broker_id: brokerId } = payload

        // Validate request body
        const { taskId: requestBodyTaskId, brokerId: requestBodyBrokerId } = request.body
        
        // Ensure the task ID in the token matches the one in the request body
        if (taskId !== requestBodyTaskId) {
          return reply.code(400).send({
            error_code: 'INVALID_TASK_ID',
            message: 'Task ID in token does not match request body'
          })
        }

        // Ensure the broker ID in the token matches the one in the request body
        if (brokerId && brokerId !== requestBodyBrokerId) {
          return reply.code(400).send({
            error_code: 'INVALID_BROKER_ID',
            message: 'Broker ID in token does not match request body'
          })
        }

        // Execute the authorization process
        const result = await authorizationOrchestrator.executeAuthorizationTask({
          taskId,
          userId,
          brokerId: requestBodyBrokerId,
        })

        // Return the result
        reply.send(result)
      } catch (error) {
        request.log.error('Authorization error:', error)
        reply.code(500).send({
          error_code: 'AUTHORIZATION_FAILED',
          message: 'Authorization process failed'
        })
      }
    }
  )

  /**
   * POST /authorize/{taskId}/resume
   * Resume a paused authorization after user verification
   */
  fastify.post(
    '/authorize/:taskId/resume',
    { schema: resumeSchema },
    async (request: FastifyRequest<{ Params: { taskId: string }; Headers: { authorization: string } }>, reply: FastifyReply) => {
      try {
        // Extract and verify the delegation token
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.code(401).send({
            error_code: 'UNAUTHORIZED',
            message: 'Missing or invalid token'
          })
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix
        const jwtSecret = process.env.JWT_SECRET
        if (!jwtSecret) {
          request.log.error('JWT_SECRET not configured')
          return reply.code(500).send({
            error_code: 'SERVER_ERROR',
            message: 'Server configuration error'
          })
        }

        const payload = await verifyJWT<DelegationTokenPayload>(token, jwtSecret)
        if (!payload) {
          return reply.code(401).send({
            error_code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          })
        }

        // Verify token is for authorization task
        if (payload.task_type !== 'broker_authorization') {
          return reply.code(403).send({
            error_code: 'FORBIDDEN',
            message: 'Token not valid for authorization task'
          })
        }

        // Extract required data from payload
        const { task_id: taskId, sub: userId } = payload

        // Ensure the task ID in the path matches the one in the token
        if (taskId !== request.params.taskId) {
          return reply.code(400).send({
            error_code: 'INVALID_TASK_ID',
            message: 'Task ID in token does not match URL parameter'
          })
        }

        // Resume the authorization process
        const result = await authorizationOrchestrator.resumeAuthorizationTask({
          taskId,
          userId,
        })

        // Return the result
        reply.send(result)
      } catch (error) {
        request.log.error('Resume authorization error:', error)
        reply.code(500).send({
          error_code: 'RESUME_AUTHORIZATION_FAILED',
          message: 'Resume authorization process failed'
        })
      }
    }
  )
}
