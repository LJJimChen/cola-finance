import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { apiRoutes } from '../../routes';
import type { AppDb } from '../../db';
import { createTestDb } from '../../db/testing';
import { toAppError } from '../../lib/errors';
import { createAuth } from '../../lib/auth';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

describe('Portfolios API', () => {
  it('lazily creates default portfolio if none exist', async () => {
    const { db } = await createTestDb();
    const auth = createAuth(db);
    
    // Create user
    await auth.api.signUpEmail({
      body: {
        email: 'lazy@example.com',
        password: 'password123',
        name: 'Lazy User',
      }
    });

    const signInRes = await auth.api.signInEmail({
        body: {
            email: 'lazy@example.com',
            password: 'password123',
        }
    });

    const token = signInRes!.token;
    
    // Setup app
    const app = new Hono<{ Variables: { db: AppDb } }>();
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    app.route('/api', apiRoutes);
    app.onError((err, c) => {
        console.error('Test Error:', err);
        const e = toAppError(err);
        return c.json(e.toResponse(), e.status as ContentfulStatusCode);
    });

    // GET /api/portfolios
    const res = await app.request('/api/portfolios', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status !== 200) {
        console.log(await res.text());
    }

    expect(res.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = await res.json() as any[];
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Main Portfolio');
  });
});
