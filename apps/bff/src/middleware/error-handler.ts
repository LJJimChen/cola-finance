import { Context } from 'hono';

export const errorHandler = (error: Error, c: Context): Response => {
  console.error(`Error: ${error.message}`, error.stack);
  return c.json({
    success: false,
    error: 'Internal Server Error',
  }, 500);
};
