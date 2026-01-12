import { MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

// Define rate limit configuration
interface RateLimitConfig {
  windowMs: number; // Window in milliseconds
  max: number; // Max requests per window
  message: string; // Message to send when rate limit exceeded
  keyGenerator?: (c: any) => string; // Function to generate key for rate limiting
}

// Store rate limit data (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(options: RateLimitConfig): MiddlewareHandler {
  const windowMs = options.windowMs || 900000; // 15 minutes default
  const max = options.max || 100; // 100 requests per window default
  const message = options.message || 'Too many requests, please try again later.';
  const keyGenerator = options.keyGenerator || ((c: any) => {
    // Default key generator uses IP address
    const connInfo = getConnInfo(c);
    return connInfo.remote.address || 'unknown';
  });

  return async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    const windowEnd = now + windowMs;

    // Get or create entry for this key
    let record = rateLimitStore.get(key);
    if (!record) {
      record = { count: 0, resetTime: windowEnd };
      rateLimitStore.set(key, record);
    }

    // Check if window has expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = windowEnd;
    }

    // Increment count
    record.count++;
    
    // Calculate remaining requests
    const remaining = Math.max(max - record.count, 0);
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', Math.floor(record.resetTime / 1000).toString());

    // Check if rate limit exceeded
    if (record.count > max) {
      c.header('Retry-After', Math.floor(windowMs / 1000).toString());
      return c.json(
        { 
          error_code: 'RATE_LIMIT_EXCEEDED', 
          message: options.message || 'Too many requests, please try again later.' 
        },
        429
      );
    }

    // Continue to next middleware/route
    await next();
  };
}

// Specific rate limiter for authorization endpoints
export function authRateLimiter(maxAttempts: number = 5, windowHours: number = 1) {
  return rateLimiter({
    windowMs: windowHours * 60 * 60 * 1000, // Convert hours to milliseconds
    max: maxAttempts,
    message: `Too many authorization attempts. Maximum ${maxAttempts} attempts per ${windowHours} hour(s).`,
    keyGenerator: (c: any) => {
      // For auth endpoints, rate limit by IP address
      const connInfo = getConnInfo(c);
      return `auth:${connInfo.remote.address || 'unknown'}`;
    }
  });
}