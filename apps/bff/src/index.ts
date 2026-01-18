import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { D1Database } from '@cloudflare/workers-types';
import { createDb, type AppDb } from './db';
import { apiRoutes } from './routes';
import { toAppError } from './lib/errors';

type Bindings = {
  DB: D1Database;
};

type Variables = {
  db: AppDb;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

app.get('/', (c) => c.json({ status: 'ok' }));

app.onError((err, c) => {
  const e = toAppError(err);
  return c.json(
    {
      error: {
        code: e.code,
        message: e.message,
        ...(e.details ? { details: e.details } : {}),
      },
    },
    e.status,
  );
});

export default app;
