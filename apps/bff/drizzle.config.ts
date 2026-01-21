import type { Config } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

function getLocalD1DB() {
  try {
    const basePath = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    const dbFile = fs
      .readdirSync(basePath)
      .find((f) => f.endsWith('.sqlite'));

    if (!dbFile) {
      throw new Error(`No D1 sqlite file found in ${basePath}`);
    }
    return path.join(basePath, dbFile);
  } catch (e) {
    console.warn(`Could not find local D1 DB: ${e}`);
    return null;
  }
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: getLocalD1DB() ?? 'file:./local.db', // Fallback to avoid crash if file not found
  },
} satisfies Config;