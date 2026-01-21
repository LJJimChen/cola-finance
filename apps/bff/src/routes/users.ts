import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { user } from '../db/schema';
import { nowIsoUtc } from '../lib/time';

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
  const result = await c.get('db').select().from(user).where(eq(user.id, userId)).limit(1);
  if (result.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  const u = result[0];
  return c.json({
    id: u.id,
    email: u.email,
    languagePreference: u.languagePreference,
    themeSettings: u.themeSettings,
    displayCurrency: u.displayCurrency,
    timeZone: u.timeZone,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  });
});

userRoutes.put('/profile', requireAuth(), zValidator('json', updateSchema), async (c) => {
  const { userId } = c.get('auth');
  const input = c.req.valid('json');

  const updated = await c
    .get('db')
    .update(user)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(user.id, userId))
    .returning();

  if (updated.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, 404);
  }

  const u = updated[0];
  return c.json({
    id: u.id,
    email: u.email,
    languagePreference: u.languagePreference,
    themeSettings: u.themeSettings,
    displayCurrency: u.displayCurrency,
    timeZone: u.timeZone,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  });
});
