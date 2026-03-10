import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb, type AppDb } from './db';
import { apiRoutes } from './routes';
import { toAppError } from './lib/errors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

type Variables = {
  db: AppDb;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

app.use(
  '/api/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }),
);

app.use('/api/*', async (c, next) => {
  const d1 = c.env.DB;
  if (!d1) {
    throw new Error('Missing D1 binding: DB');
  }
  c.set('db', createDb(d1));
  await next();
});

app.route('/api', apiRoutes);

app.get('/', (c) => c.json({ status: 'ok', trustedOrigins: c.env.BETTER_AUTH_TRUSTED_ORIGINS ?? ""  }));

app.onError((err, c) => {
  console.error('Unhandled Error:', err);
  const e = toAppError(err);
  return c.json(
    {
      error: {
        code: e.code,
        message: e.message,
        ...(e.details ? { details: e.details } : {}),
      },
    },
    e.status as ContentfulStatusCode,
  );
});

export default app;
