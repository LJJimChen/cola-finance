import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDbBindings } from '../db';
import { users } from '../db/schema';

// This will be initialized later with the actual database instance
let dbInstance: any = null;

export const initializeAuth = (env: { DB: D1Database }) => {
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
    advanced: {
      generateId: () => crypto.randomUUID(),
    },
  });
};

// Export the auth instance to be used in middleware
export let authInstance: ReturnType<typeof betterAuth> | null = null;

export const setAuthInstance = (instance: ReturnType<typeof betterAuth>) => {
  authInstance = instance;
};