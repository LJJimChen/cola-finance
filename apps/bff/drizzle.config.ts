import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

function listLocalDatabases() {
  const basePath = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  
  if (!fs.existsSync(basePath)) {
    return [];
  }

  return fs
    .readdirSync(basePath)
    .filter((file) => file.endsWith('.sqlite'))
    .map((file) => path.join(basePath, file));
}

const localDbs = listLocalDatabases();

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: localDbs[0] || '',
  },
  // dbCredentials: {
  //   accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
  //   databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
  //   token: process.env.CLOUDFLARE_D1_TOKEN!,
  // },
});
