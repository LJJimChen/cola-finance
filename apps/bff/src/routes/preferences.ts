import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { User } from 'schema/dist/entities/user';

// Assuming we have a database client and authentication middleware
const app = new Hono();

// Validator for the request body
const updatePreferencesSchema = z.object({
  display_currency: z.string().length(3).optional(), // ISO 4217 currency code
  locale: z.enum(['en', 'zh']).optional(),
});

// PATCH /auth/me/preferences - Update user preferences including display currency
app.patch('/auth/me/preferences', zValidator('json', updatePreferencesSchema), async (c) => {
  try {
    // Get authenticated user from context (assumes auth middleware has set this)
    const user = c.get('user') as User;
    if (!user) {
      return c.json({ error_code: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
    }

    const { display_currency, locale } = await c.req.json();

    // Prepare update data
    const updateData: Partial<User> = {};
    if (display_currency) {
      // Validate that it's a valid ISO 4217 currency code
      // In a real implementation, we'd have a more comprehensive validation
      if (!/^[A-Z]{3}$/.test(display_currency)) {
        return c.json({ error_code: 'INVALID_CURRENCY', message: 'Invalid currency code' }, 400);
      }
      updateData.display_currency = display_currency;
    }

    if (locale) {
      updateData.locale = locale;
    }

    // Update user preferences in the database
    // This would use Drizzle ORM in the real implementation
    // const updatedUser = await db.update(users).set(updateData).where(eq(users.id, user.id)).returning();
    
    // For now, returning a mock response
    const updatedUser = {
      ...user,
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    return c.json(updatedUser);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return c.json({ error_code: 'INTERNAL_ERROR', message: 'Failed to update preferences' }, 500);
  }
});

export { app as preferencesRoutes };