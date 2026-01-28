import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PortfolioServiceImpl } from '../services/portfolio-service';
import type { AppDb } from '../db';

const app = new Hono<{ Variables: { db: AppDb } }>();

// GET /portfolios/:portfolioId/dashboard
app.get('/:portfolioId/dashboard', async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const portfolioId = c.req.param('portfolioId');
    const displayCurrency = c.req.query('displayCurrency') || 'CNY';

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const portfolioService = new PortfolioServiceImpl(c.get('db'));
    const dashboardData = await portfolioService.getDashboardData(
      userId,
      portfolioId,
      displayCurrency
    );

    return c.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;
