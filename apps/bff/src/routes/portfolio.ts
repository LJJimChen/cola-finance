/**
 * Portfolio routes
 *
 * Intent: Handle portfolio-related operations (summary, holdings)
 * Provides endpoints for portfolio data retrieval
 *
 * Contract:
 * - GET /portfolio: Return portfolio summary with total value and returns
 * - GET /portfolio/holdings: Return list of holdings with original currency values
 */
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { getPortfolioSummary, getHoldings } from '../services/portfolio.service'
import type { Bindings } from '../index'

// Create Hono app for portfolio routes
const app = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /portfolio - Get portfolio summary
app.get('/', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Get portfolio summary from the service
    const portfolioSummary = await getPortfolioSummary(c.env.DB, userId)

    return c.json({
      portfolio: portfolioSummary
    })
  } catch (error) {
    console.error('Error fetching portfolio summary:', error)
    return c.json(
      { error_code: 'FETCH_PORTFOLIO_FAILED', message: 'Failed to fetch portfolio summary' },
      500
    )
  }
})

// GET /portfolio/holdings - Get portfolio holdings
app.get('/holdings', async (c) => {
  const userId = c.get('userId')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Get holdings from the service
    const holdings = await getHoldings(c.env.DB, userId)

    return c.json({
      holdings
    })
  } catch (error) {
    console.error('Error fetching portfolio holdings:', error)
    return c.json(
      { error_code: 'FETCH_HOLDINGS_FAILED', message: 'Failed to fetch portfolio holdings' },
      500
    )
  }
})

export default app