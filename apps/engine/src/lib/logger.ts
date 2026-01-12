/**
 * Logging utilities for Engine services
 *
 * Intent: Provide structured logging for all Engine services
 * Logs are written as structured JSON for easy parsing and analysis
 *
 * Contract:
 * - All service methods should log inputs, outputs, and errors
 * - Log format follows structured JSON format
 * - Errors include stack traces and context
 */

import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  method: string;
  userId?: string;
  taskId?: string;
  message: string;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class EngineLogger {
  private logFilePath: string;

  constructor(logFilePath: string = './logs/engine.log') {
    this.logFilePath = logFilePath;
    
    // Ensure log directory exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(entry: LogEntry): void {
    // Write to console for development
    console.log(JSON.stringify(entry));
    
    // Write to file for persistence
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  info(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, taskId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      service,
      method,
      message,
      data,
      userId,
      taskId,
    });
  }

  warn(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, taskId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service,
      method,
      message,
      data,
      userId,
      taskId,
    });
  }

  error(service: string, method: string, message: string, error?: Error, data?: Record<string, any>, userId?: string, taskId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      service,
      method,
      message,
      data,
      userId,
      taskId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  debug(service: string, method: string, message: string, data?: Record<string, any>, userId?: string, taskId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'debug',
      service,
      method,
      message,
      data,
      userId,
      taskId,
    });
  }
}

// Global logger instance
let logger: EngineLogger;

export function initializeLogger(logFilePath?: string) {
  logger = new EngineLogger(logFilePath);
}

export function getLogger(): EngineLogger {
  if (!logger) {
    logger = new EngineLogger();
  }
  return logger;
}

// Higher-order function to wrap service methods with logging
export function withLogging<T extends any[], R>(
  service: string,
  method: string,
  fn: (...args: T) => Promise<R>,
  userId?: string,
  taskId?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const logger = getLogger();
    
    try {
      logger.debug(service, method, 'Method called', { 
        argCount: args.length,
        userId,
        taskId
      }, userId, taskId);
      
      const result = await fn(...args);
      
      logger.info(service, method, 'Method completed', { 
        duration: Date.now() - startTime,
        userId,
        taskId
      }, userId, taskId);
      
      return result;
    } catch (error) {
      logger.error(
        service, 
        method, 
        'Method failed', 
        error instanceof Error ? error : new Error(String(error)),
        { 
          duration: Date.now() - startTime,
          userId,
          taskId
        },
        userId,
        taskId
      );
      
      throw error;
    }
  };
}