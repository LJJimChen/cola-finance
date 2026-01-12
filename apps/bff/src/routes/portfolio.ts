/**
 * Portfolio routes
 *
 * Intent: Handle portfolio-related operations (summary, holdings)
 * Provides endpoints for portfolio data retrieval with currency normalization
 *
 * Contract:
 * - GET /portfolio: Return portfolio summary with total value and returns
 * - GET /portfolio?currency=:currency: Return portfolio summary normalized to specified currency
 * - GET /portfolio/holdings: Return list of holdings with original currency values
 * - GET /portfolio/holdings?currency=:currency: Return list of holdings normalized to specified currency
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth'
import { PortfolioService } from '../services/portfolio.service'
import type { Bindings } from '../index'

// Create Hono app for portfolio routes
const app = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /portfolio - Get portfolio summary
app.get('/', zValidator('query', z.object({
  currency: z.string().length(3).optional(), // ISO 4217 currency code
})), async (c) => {
  const userId = c.get('userId')
  const { currency: targetCurrency } = c.req.valid('query')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Create portfolio service instance
    const portfolioService = new PortfolioService(c.env)

    // Get portfolio summary from the service, with optional currency normalization
    const portfolioSummary = await portfolioService.getPortfolioSummary(userId, targetCurrency)

    return c.json({
      totalValue: portfolioSummary.totalValue,
      todaysReturn: portfolioSummary.todaysReturn,
      todaysReturnPercent: portfolioSummary.todaysReturnPercent,
      lastUpdated: portfolioSummary.lastUpdated,
      displayCurrency: portfolioSummary.displayCurrency,
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
app.get('/holdings', zValidator('query', z.object({
  currency: z.string().length(3).optional(), // ISO 4217 currency code
})), async (c) => {
  const userId = c.get('userId')
  const { currency: targetCurrency } = c.req.valid('query')

  if (!userId) {
    return c.json({ error_code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
  }

  try {
    // Create portfolio service instance
    const portfolioService = new PortfolioService(c.env)

    // Get holdings from the service, with optional currency normalization
    const holdings = await portfolioService.getHoldings(userId, targetCurrency)

    return c.json({
      holdings,
      displayCurrency: targetCurrency || 'USD' // Default to USD if no currency specified
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