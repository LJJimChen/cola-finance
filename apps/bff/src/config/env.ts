// Environment configuration
export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

// Function to validate and load environment variables
export function loadEnvConfig(): EnvConfig {
  const config: Partial<EnvConfig> = {};
  
  // Database URL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  config.DATABASE_URL = process.env.DATABASE_URL;
  
  // JWT Secret
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  config.JWT_SECRET = process.env.JWT_SECRET;
  
  // Cloudflare Account ID
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required');
  }
  config.CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  // Cloudflare API Token
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
  }
  config.CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  
  // Better Auth Secret
  if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required');
  }
  config.BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
  
  // Better Auth URL
  if (!process.env.BETTER_AUTH_URL) {
    throw new Error('BETTER_AUTH_URL environment variable is required');
  }
  config.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL;
  
  return config as EnvConfig;
}

// Create a default export that loads the config when the module is imported
const envConfig = loadEnvConfig();
export default envConfig;