/**
 * Centralized logging system with levels
 * Replaces scattered console.log statements with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;
  private serviceName: string;

  constructor(serviceName: string = 'api', minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = this.getMinLevelFromEnv() ?? minLevel;
  }

  private getMinLevelFromEnv(): LogLevel | null {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();

    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: string, module: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level}] [${this.serviceName}:${module}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      return `${baseLog} ${JSON.stringify(context)}`;
    }

    return baseLog;
  }

  debug(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', module, message, context));
    }
  }

  info(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', module, message, context));
    }
  }

  warn(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', module, message, context));
    }
  }

  error(module: string, message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      };
      console.error(this.formatMessage('ERROR', module, message, errorContext));
    }
  }

  /**
   * Creates a child logger with a specific module name
   * Useful for creating module-scoped loggers
   */
  child(module: string) {
    return {
      debug: (message: string, context?: LogContext) => this.debug(module, message, context),
      info: (message: string, context?: LogContext) => this.info(module, message, context),
      warn: (message: string, context?: LogContext) => this.warn(module, message, context),
      error: (message: string, error?: Error | unknown, context?: LogContext) => this.error(module, message, error, context),
    };
  }
}

// Default logger instance
export const logger = new Logger('aurum-api', LogLevel.INFO);

// Convenience function to create module-specific loggers
export function createLogger(module: string) {
  return logger.child(module);
}