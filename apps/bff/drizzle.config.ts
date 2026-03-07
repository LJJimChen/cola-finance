import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import fs from 'fs';
import path from 'path';

function getLocalD1DB() {
  try {
    const basePath = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
    
    if (!fs.existsSync(basePath)) {
      return undefined;
    }

    const dbFile = fs
      .readdirSync(basePath)
      .find((file) => file.endsWith('.sqlite'));
      
    return dbFile ? path.join(basePath, dbFile) : undefined;
  } catch {
    return undefined;
  }
}

const isProd = process.env.NODE_ENV === 'production';
const localDB = getLocalD1DB();

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  // 如果是本地开发环境且找到了本地 DB 文件，则直接连接文件
  // 否则尝试连接远程 D1 (需要环境变量)
  ...(localDB && !isProd
    ? {
        dbCredentials: {
          url: localDB,
        },
      }
    : {
      // for drizzle-kit studio
        driver: 'd1-http',
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
          token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
      }),
});


