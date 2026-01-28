import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { RebalancingServiceImpl } from '../services/rebalancing-service';
import type { AppDb } from '../db';

const app = new Hono<{ Variables: { db: AppDb } }>();

// Schema for request validation
const updateCategorySchema = z.object({
  name: z.string().optional(),
  targetAllocation: z.number().min(0).max(100).optional(),
});

// PUT /categories/:categoryId
app.put('/:categoryId', zValidator('json', updateCategorySchema), async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const categoryId = c.req.param('categoryId');
    const { targetAllocation } = c.req.valid('json');

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    if (targetAllocation === undefined) {
      return c.json({ error: 'targetAllocation is required' }, 400);
    }

    const db = c.get('db');
    const rebalancingService = new RebalancingServiceImpl(db);

    const updatedCategory = await rebalancingService.updateCategoryTargetAllocation(
      userId, 
      categoryId, 
      targetAllocation
    );

    return c.json(updatedCategory);
  } catch (error: any) {
    console.error('Error updating category:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;