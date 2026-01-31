import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { seedNewUser } from '../services/seed-service';
import { nowIsoUtc } from '../lib/time';

export const devRoutes = new Hono<{
  Variables: {
    db: import('../db').AppDb;
    auth: import('../middleware/auth').AuthContext;
  };
}>();

// POST /api/dev/seed-me
// Seeds the currently authenticated user with demo data.
// Useful if automatic seeding failed or for testing purposes.
devRoutes.post('/seed-me', requireAuth(), async (c) => {
  const { userId } = c.get('auth');
  const db = c.get('db');
  
  try {
    await seedNewUser(db, {
      userId,
      now: nowIsoUtc(),
    });
    return c.json({ success: true, message: 'User seeded successfully' });
  } catch (error) {
    console.error('Manual seed failed:', error);
    return c.json(
      { 
        success: false, 
        message: 'Failed to seed user', 
        error: (error as Error).message 
      }, 
      500
    );
  }
});
