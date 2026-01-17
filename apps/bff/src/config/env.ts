// Environment configuration
export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export type EnvSource = Record<string, string | undefined>;

export function loadEnvConfig(env: EnvSource): EnvConfig {
  const config: Partial<EnvConfig> = {};
  
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  config.DATABASE_URL = env.DATABASE_URL;
  
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  config.JWT_SECRET = env.JWT_SECRET;
  
  if (!env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
  }
  config.CLOUDFLARE_ACCOUNT_ID = env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
  }
  config.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;
  
  if (!env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  }
  config.BETTER_AUTH_SECRET = env.BETTER_AUTH_SECRET;
  
  if (!env.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL environment variable is required');
  }
  config.BETTER_AUTH_URL = env.BETTER_AUTH_URL;
  
  return config as EnvConfig;
}
