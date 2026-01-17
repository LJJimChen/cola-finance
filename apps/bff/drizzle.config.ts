import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'turso', // Use appropriate driver for Cloudflare D1
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;