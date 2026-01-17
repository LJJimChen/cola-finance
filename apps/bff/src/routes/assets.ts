import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { assetService } from '../services/asset-service';

const app = new Hono();

// GET /portfolios/:portfolioId/assets
app.get('/:portfolioId/assets', async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const portfolioId = c.req.param('portfolioId');

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const assets = await assetService.getAssetsByPortfolio(userId, portfolioId);

    return c.json(assets);
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;