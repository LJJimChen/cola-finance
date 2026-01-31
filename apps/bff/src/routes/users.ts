import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { UserServiceImpl } from '../services/user-service';

const updateSchema = z.object({
  languagePreference: z.enum(['zh', 'en']).optional(),
  themeSettings: z.enum(['light', 'dark', 'auto']).optional(),
  displayCurrency: z.string().min(3).max(8).optional(),
  timeZone: z.string().min(1).optional(),
});

export const userRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

userRoutes.get('/profile', requireAuth(), async (c) => {
  const { userId } = c.get('auth');
  const userService = new UserServiceImpl(c.get('db'));
  const userProfile = await userService.getUserProfile(userId);
  
  if (!userProfile) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  return c.json(userProfile);
});

userRoutes.put('/profile', requireAuth(), zValidator('json', updateSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');
  const userService = new UserServiceImpl(c.get('db'));

  const updatedUser = await userService.updateUserProfile(userId, input);

  if (!updatedUser) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  return c.json(updatedUser);
});
