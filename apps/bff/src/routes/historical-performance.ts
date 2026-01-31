import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { requireAuth } from '../middleware/auth';
import { PortfolioServiceImpl } from '../services/portfolio-service';
import { PortfolioHistoryServiceImpl } from '../services/portfolio-history-service';
import { AppError } from '../lib/errors';

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displayCurrency: z.string().min(3).max(8).optional(),
});

export const historicalPerformanceRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

historicalPerformanceRoutes.get('/:portfolioId', requireAuth(), zValidator('query', querySchema), async (c) => {
  const { userId } = c.get('auth');
  const portfolioId = c.req.param('portfolioId');
  const query = c.req.valid('query');

  const displayCurrency = query.displayCurrency ?? 'CNY';
  // Read timezone from header, fallback to UTC
  // This ensures the daily grouping aligns with the user's local day boundaries
  const timeZone = c.req.header('X-Timezone') ?? 'UTC';

  const db = c.get('db');

  // 1. Verify Portfolio Ownership
  const portfolioService = new PortfolioServiceImpl(db);
  try {
    // If portfolio doesn't exist or user doesn't own it, this will throw
    await portfolioService.getPortfolio(userId, portfolioId);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    return c.json({ error: { code: 'NOT_FOUND', message: 'Portfolio not found' } }, 404);
  }

  // 2. Fetch Historical Performance Data
  const historyService = new PortfolioHistoryServiceImpl(db);
  
  try {
    const result = await historyService.getHistoricalPerformance(
      portfolioId,
      query.startDate,
      query.endDate,
      displayCurrency,
      timeZone
    );

    return c.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toResponse(), error.status as ContentfulStatusCode);
    }
    throw error;
  }
});

