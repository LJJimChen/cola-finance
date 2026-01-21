import type { MiddlewareHandler } from 'hono';
import { createAuth } from '../lib/auth';
import { AppError } from '../lib/errors';
import type { D1Database } from '@cloudflare/workers-types';
import type { AppDb } from '../db';
import { session as sessionTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export type AuthContext = {
  userId: string;
};

export function requireAuth(): MiddlewareHandler<{
  Bindings: CloudflareBindings;
  Variables: {
    auth: AuthContext;
    db?: AppDb;
  };
}> {
  return async (c, next) => {
    const db = c.get('db');
    const trustedOrigins = c.env?.BETTER_AUTH_TRUSTED_ORIGINS 
        ? c.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map(o => o.trim()) 
        : [];
    const auth = createAuth(db || c.env?.DB, undefined, trustedOrigins);
    
    const session = await auth.api.getSession({
       headers: c.req.raw.headers,
     });

    if (db && !session) {
        const token = c.req.header('authorization')?.replace('Bearer ', '');
        if (token) {
            const sessionInDb = await db.select().from(sessionTable).where(eq(sessionTable.token, token)).get();
            if (sessionInDb && sessionInDb.expiresAt > new Date()) {
                 c.set('auth', { userId: sessionInDb.userId });
                 await next();
                 return;
            }
        }
    }
    
    if (!session) {
      console.log('Auth failed. Headers:', Object.fromEntries(c.req.raw.headers.entries()));
      // Clear the session cookie to help the client recover from stale sessions
      // Note: HttpOnly cookies can only be cleared by the server.
      // We clear both the standard and secure prefixes to ensure it works in all environments.
      c.header('Set-Cookie', 'better-auth.session_token=; Max-Age=0; Path=/; HttpOnly');
      c.header('Set-Cookie', '__Secure-better-auth.session_token=; Max-Age=0; Path=/; HttpOnly; Secure', { append: true });
      
      // Return JSON directly to ensure headers are sent (throwing AppError might be handled by a global handler that resets headers)
      return c.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, 401);
    }

    c.set('auth', { userId: session.user.id });
    await next();
  };
}
