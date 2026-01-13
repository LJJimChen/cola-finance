/**
 * Collection routes
 *
 * Intent: Handle portfolio data collection requests from BFF
 * Executes collection state machine for fetching holdings from broker connections
 *
 * Contract:
 * - POST /collect: Start collection process
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { DelegationTokenPayload } from '../../middleware/validate-delegation-token'
import { collectionOrchestrator } from '../../services/collection-orchestrator'

// Define route schema
const collectSchema = {
  body: z.object({
    taskId: z.string(),
    connectionId: z.string(),
  }),
  headers: z.object({
    authorization: z.string(),
  }),
}

export async function collectionRoutes(fastify: FastifyInstance) {
  /**
   * POST /collect
   * Start the collection process for a broker connection
   */
  fastify.post(
    '/collect',
    { schema: collectSchema },
    async (request: FastifyRequest<{ Body: { taskId: string; connectionId: string }; Headers: { authorization: string } }>, reply: FastifyReply) => {
      try {
        let payload: DelegationTokenPayload
        try {
          payload = await request.jwtVerify<DelegationTokenPayload>()
        } catch (error) {
          request.log.error({ error }, 'Token validation failed')
          return reply.code(401).send({
            error_code: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
          })
        }

        // Verify token is for data collection task
        if (payload.task_type !== 'data_collection') {
          return reply.code(403).send({
            error_code: 'FORBIDDEN',
            message: 'Token not valid for collection task'
          })
        }

        // Extract required data from payload
        const { task_id: taskId, sub: userId } = payload

        // Validate request body
        const { taskId: requestBodyTaskId, connectionId } = request.body
        
        // Ensure the task ID in the token matches the one in the request body
        if (taskId !== requestBodyTaskId) {
          return reply.code(400).send({
            error_code: 'INVALID_TASK_ID',
            message: 'Task ID in token does not match request body'
          })
        }

        // Execute the collection process
        const result = await collectionOrchestrator.executeCollectionTask({
          taskId,
          userId,
          connectionId,
        })

        // Return the result
        reply.send(result)
      } catch (error) {
        request.log.error({ error }, 'Collection error')
        reply.code(500).send({
          error_code: 'COLLECTION_FAILED',
          message: 'Collection process failed'
        })
      }
    }
  )
}
