import { MiddlewareHandler } from 'hono';
import { initializeAuth, setAuthInstance } from '../auth';

export const auth: MiddlewareHandler = async (c, next) => {
  const authInstance = initializeAuth(c.env);
  setAuthInstance(authInstance);

  const session = await authInstance.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);

  await next();
};
