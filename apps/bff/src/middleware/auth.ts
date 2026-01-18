import type { MiddlewareHandler } from 'hono';
import { and, eq, gt } from 'drizzle-orm';
import type { AppDb } from '../db';
import { sessions } from '../db/schema';
import { AppError } from '../lib/errors';
import { nowIsoUtc } from '../lib/time';

export type AuthContext = {
  userId: string;
};

export function requireAuth(): MiddlewareHandler<{
  Variables: {
    db: AppDb;
    auth: AuthContext;
  };
}> {
  return async (c, next) => {
    const authorization = c.req.header('Authorization');
    if (!authorization) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Missing Authorization header' });
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid Authorization header' });
    }

    const db = c.get('db');
    const now = nowIsoUtc();

    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
      .limit(1);

    if (session.length === 0) {
      throw new AppError({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid or expired session token' });
    }

    c.set('auth', { userId: session[0].userId });
    await next();
  };
}

