import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { categoryService } from '../services/category-service';

const app = new Hono();

// GET /portfolios/:portfolioId/categories
app.get('/:portfolioId/categories', async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const portfolioId = c.req.param('portfolioId');

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // For now, we'll return all categories for the user
    // In a real implementation, we might want to filter based on portfolio
    const categories = await categoryService.getCategoriesByPortfolio(userId, portfolioId);

    return c.json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;