import { Hono } from 'hono';
import { rebalancingService } from '../services/rebalancing-service';

const app = new Hono();

// GET /portfolios/:portfolioId/rebalance
app.get('/:portfolioId/rebalance', async (c) => {
  try {
    const userId = c.req.header('X-User-ID'); // Assuming user ID comes from auth middleware
    const portfolioId = c.req.param('portfolioId');

    if (!userId) {
      return c.json({ error: 'User not authenticated' }, 401);
    }

    const rebalanceRecommendations = await rebalancingService.getRebalanceRecommendations(
      userId, 
      portfolioId
    );

    return c.json(rebalanceRecommendations);
  } catch (error: any) {
    console.error('Error fetching rebalance recommendations:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

export default app;