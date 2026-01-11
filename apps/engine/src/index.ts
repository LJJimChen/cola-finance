/**
 * Engine entry point - Stateful Node.js service
 * 
 * Intent: Main entry point for the Engine service
 * Responsible for browser automation, task state management, and broker integration
 * 
 * Input: HTTP requests from BFF (authenticated with JWT delegation tokens)
 * Output: Task execution results
 * Side effects: Browser automation (Playwright), file I/O, BFF callbacks
 * 
 * Constitution compliance:
 * - No broker credentials stored
 * - Defensive error handling (all errors logged with context)
 * - Clear boundaries (Engine never directly accessed by frontend)
 */
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

// JWT authentication plugin
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
})

// CORS (only allow BFF origin)
fastify.register(cors, {
  origin: process.env.BFF_API_URL || 'http://localhost:8787',
  credentials: true,
})

// Health check endpoint
fastify.get('/', async () => {
  return {
    service: 'Cola Finance Engine',
    version: '0.1.0',
    environment: process.env.ENVIRONMENT || 'development',
    status: 'ok',
  }
})

// Health check with browser pool status
fastify.get('/health', async () => {
  return {
    status: 'healthy',
    browser_pool: 'initialized', // Will be updated when browser pool is implemented
    timestamp: new Date().toISOString(),
  }
})

// Routes will be added in Phase 3 (User Story implementation)
// Example: fastify.register(authorizationRoutes, { prefix: '/authorize' })
// Example: fastify.register(collectionRoutes, { prefix: '/collect' })

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10)
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    fastify.log.info(`Engine server started on ${host}:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received, shutting down gracefully')
  await fastify.close()
  process.exit(0)
})

start()
