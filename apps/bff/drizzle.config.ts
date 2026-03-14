import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getLocalD1DB } from './scripts/utils/db-path';

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


