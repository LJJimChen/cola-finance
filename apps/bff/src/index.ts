/**
 * BFF entry point - Cloudflare Worker
 *
 * Intent: Main entry point for the Backend-for-Frontend API
 * Provides REST API for the frontend, handles authentication, and coordinates with Engine
 *
 * Input: HTTP requests from frontend
 * Output: JSON responses conforming to OpenAPI contract
 * Side effects: Database reads/writes, Engine API calls
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorMiddleware } from './middleware/error'
import authRoutes from './routes/auth'
import brokersRoutes from './routes/brokers'
import tasksRoutes from './routes/tasks'
import portfolioRoutes from './routes/portfolio'

/**
 * Cloudflare Workers environment bindings
 */
type Bindings = {
  DB: D1Database
  EXCHANGE_RATE_KV: KVNamespace
  JWT_SECRET: string
  ENGINE_API_URL: string
  EXCHANGE_API_KEY: string
  ENVIRONMENT: string
}

/**
 * Hono app instance with middleware pipeline
 *
 * Middleware order:
 * 1. Logger: Request/response logging
 * 2. CORS: Cross-origin resource sharing
 * 3. Error handler: Global error catching
 */
const app = new Hono<{ Bindings: Bindings }>()

// Global middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://cola-finance.app'],
    credentials: true,
  })
)
app.use('*', errorMiddleware())

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    service: 'Cola Finance BFF',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT || 'development',
    status: 'ok',
  })
})

// Health check with DB connection test
app.get('/health', async (c) => {
  try {
    // Test DB connection
    await c.env.DB.prepare('SELECT 1').first()

    return c.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      503
    )
  }
})

// Register routes
app.route('/auth', authRoutes)
app.route('/brokers', brokersRoutes)
app.route('/tasks', tasksRoutes)
app.route('/portfolio', portfolioRoutes)

export default app
