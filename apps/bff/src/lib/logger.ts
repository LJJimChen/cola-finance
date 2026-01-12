/**
 * Logging utilities for BFF services
 *
 * Intent: Provide structured logging for all BFF services
 * Logs are stored in Cloudflare Workers KV for persistence and querying
 *
 * Contract:
 * - All service methods should log inputs, outputs, and errors
 * - Log format follows structured JSON format
 * - Errors include stack traces and context
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  method: string;
  userId?: string;
  requestId?: string;
  message: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class BFFLogger {
  constructor(private kvNamespace: KVNamespace | undefined) {}

  async log(entry: LogEntry): Promise<void> {
    // Log to console for development
    console.log(JSON.stringify(entry));
    
    // In production, also store in KV namespace if available
    if (this.kvNamespace) {
      try {
        const logKey = `log:${entry.timestamp}:${entry.service}:${entry.method}`;
        await this.kvNamespace.put(logKey, JSON.stringify(entry), {
          expirationTtl: 60 * 60 * 24 * 7, // 7 days
        });
      } catch (error) {
        console.error('Failed to store log in KV:', error);
      }
    }
  }

  async info(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, requestId?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      service,
      method,
      message,
      data,
      userId,
      requestId,
    });
  }

  async warn(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, requestId?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service,
      method,
      message,
      data,
      userId,
      requestId,
    });
  }

  async error(service: string, method: string, message: string, error?: Error, data?: Record<string, any>, userId?: string, requestId?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      service,
      method,
      message,
      data,
      userId,
      requestId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  async debug(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, requestId?: string): Promise<void> {
    await this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      service,
      method,
      message,
      data,
      userId,
      requestId,
    });
  }
}

// Global logger instance
let logger: BFFLogger;

export function initializeLogger(kvNamespace?: KVNamespace) {
  logger = new BFFLogger(kvNamespace);
}

export function getLogger(): BFFLogger {
  if (!logger) {
    // Fallback logger without KV storage
    logger = new BFFLogger(undefined);
  }
  return logger;
}

// Higher-order function to wrap service methods with logging
export function withLogging<T extends any[], R>(
  service: string,
  method: string,
  fn: (...args: T) => Promise<R>,
  userId?: string,
  requestId?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const logger = getLogger();
    
    try {
      await logger.debug(service, method, 'Method called', { 
        argCount: args.length,
        userId,
        requestId
      }, userId, requestId);
      
      const result = await fn(...args);
      
      await logger.info(service, method, 'Method completed', { 
        duration: Date.now() - startTime,
        userId,
        requestId
      }, userId, requestId);
      
      return result;
    } catch (error) {
      await logger.error(
        service, 
        method, 
        'Method failed', 
        error instanceof Error ? error : new Error(String(error)),
        { 
          duration: Date.now() - startTime,
          userId,
          requestId
        },
        userId,
        requestId
      );
      
      throw error;
    }
  };
}