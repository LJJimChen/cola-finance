import { Hono } from 'hono';

const app = new Hono();

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Categories API is running!' });
});

export { app as categoryRoutes };
