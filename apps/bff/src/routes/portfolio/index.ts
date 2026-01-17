import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Portfolio API is running!' });
});

export { app as portfolioRoutes };
