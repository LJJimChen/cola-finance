import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Dashboard API is running!' });
});

export { app as dashboardRoutes };
