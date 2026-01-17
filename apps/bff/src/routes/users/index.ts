import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Users API is running!' });
});

export { app as userRoutes };