import { Hono } from 'hono';
import { createAuth } from '../lib/auth';

export const authRoutes = new Hono<{
  Bindings: CloudflareBindings;
}>();

authRoutes.all('/*', async (c) => {
  const url = new URL(c.req.url);
  const baseURL = url.origin + '/api/auth';
  
  const trustedOrigins = c.env.BETTER_AUTH_TRUSTED_ORIGINS 
    ? c.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map(o => o.trim()) 
    : [];

  const auth = createAuth(c.env.DB, baseURL, trustedOrigins);
  return auth.handler(c.req.raw);
});
