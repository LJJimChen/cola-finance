import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDbBindings } from '../db';

// This will be initialized later with the actual database instance
type AuthInstance = ReturnType<typeof betterAuth>;

let dbInstance: ReturnType<typeof createDbBindings> | null = null;

export const initializeAuth = (env: { DB: D1Database }): AuthInstance => {
  dbInstance = createDbBindings(env);
  
  return betterAuth({
    database: drizzleAdapter(dbInstance, {
      provider: 'pg', // Using PostgreSQL schema even though it's D1
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      // Add social providers as needed
    },
  });
};

// Export the auth instance to be used in middleware
export let authInstance: AuthInstance | null = null;

export const setAuthInstance = (instance: AuthInstance): void => {
  authInstance = instance;
};
