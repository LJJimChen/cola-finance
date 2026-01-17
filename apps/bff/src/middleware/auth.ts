import { MiddlewareHandler } from 'hono';
import { initializeAuth, setAuthInstance } from '../auth';

// Authentication middleware
export const auth: MiddlewareHandler = async (c, next) => {
  // Initialize auth with the database instance from environment
  const authInstance = initializeAuth(c.env);
  setAuthInstance(authInstance);
  
  // Get the session from the request
  const session = await authInstance.$ctx.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  // Attach user info to the context
  c.set('user', session.user);
  
  await next();
};

// Error handling middleware
export const errorHandler = (error: Error, c: any) => {
  console.error(`Error: ${error.message}`, error.stack);
  return c.json({ 
    success: false, 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  }, 500);
};