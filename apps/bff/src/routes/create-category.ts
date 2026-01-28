import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CategoryServiceImpl } from '../services/category-service';
import type { AppDb } from '../db';

const app = new Hono<{ Variables: { db: AppDb } }>();

// Schema for request validation
const createCategorySchema = z.object({
  name: z.string().min(1),
  targetAllocation: z.number().min(0).max(100).optional().default(0),
});

// POST /portfolios/:portfolioId/categories
app.post('/:portfolioId/categories', zValidator('json', createCategorySchema), async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const portfolioId = c.req.param('portfolioId');
    const { name, targetAllocation } = c.req.valid('json');

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    // In a real implementation, we might want to associate the category with the portfolio
    // For now, we'll just create the category for the user
    const categoryService = new CategoryServiceImpl(c.get('db'));
    const newCategory = await categoryService.createCategory(userId, portfolioId, {
      name,
      targetAllocation,
    });

    return c.json(newCategory, 201);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;
