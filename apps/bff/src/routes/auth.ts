import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from '../services/auth-service';
import { requireAuth } from '../middleware/auth';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  languagePreference: z.enum(['zh', 'en']).optional(),
  themeSettings: z.enum(['light', 'dark', 'auto']).optional(),
  displayCurrency: z.string().min(3).max(8).optional(),
  timeZone: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
  };
}>();

authRoutes.post('/signup', zValidator('json', signupSchema), async (c) => {
  const input = c.req.valid('json');
  const service = new AuthService(c.get('db'));
  const result = await service.signup(input);
  return c.json({ success: true, userId: result.userId });
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const input = c.req.valid('json');
  const service = new AuthService(c.get('db'));
  const result = await service.login(input.email, input.password);
  return c.json({ success: true, token: result.token });
});

authRoutes.post('/logout', requireAuth(), async (c) => {
  const authorization = c.req.header('Authorization');
  const token = authorization?.split(' ')[1];
  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401);
  }

  const service = new AuthService(c.get('db'));
  await service.logout(token);
  return c.json({ success: true });
});

