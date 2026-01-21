// Logging levels
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

// Log entry interface
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

// Main logger class
class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logBuffer: LogEntry[] = [];

  // Singleton pattern
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Set the minimum log level
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Log a message
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // Only log if the level is greater than or equal to the current log level
    if (this.getLogLevelValue(level) < this.getLogLevelValue(this.logLevel)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error,
    };

    this.logBuffer.push(logEntry);

    // In a real application, you would send this to a logging service
    this.outputLog(logEntry);
  }

  // Helper to convert log level to numeric value
  private getLogLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG: return 0;
      case LogLevel.INFO: return 1;
      case LogLevel.WARN: return 2;
      case LogLevel.ERROR: return 3;
      default: return 1;
    }
  }

  // Output the log entry (in this case to console, but could be sent to a service)
  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatLogEntry(entry);
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  // Format the log entry for output
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` Error: ${entry.error.stack || entry.error.message}` : '';
    
    return `[${timestamp}] ${entry.level}: ${entry.message}${contextStr}${errorStr}`;
  }

  // Public logging methods
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Get the log buffer (useful for sending logs to a service)
  public getLogBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear the log buffer
  public clearLogBuffer(): void {
    this.logBuffer = [];
  }

  // Send logs to a remote service (placeholder implementation)
  public async sendLogsToRemoteService(): Promise<void> {
    // In a real implementation, you would send the logs to a remote service
    // For now, we'll just clear the buffer
    this.clearLogBuffer();
  }
}

// Create and export the singleton logger instance
export const logger = Logger.getInstance();

// Create convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => logger.debug(message, context);
export const logInfo = (message: string, context?: Record<string, any>) => logger.info(message, context);
export const logWarn = (message: string, context?: Record<string, any>) => logger.warn(message, context);
export const logError = (message: string, context?: Record<string, any>, error?: Error) => logger.error(message, context, error);
