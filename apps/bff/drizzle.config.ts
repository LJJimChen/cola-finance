import type { Config } from 'drizzle-kit';
export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;