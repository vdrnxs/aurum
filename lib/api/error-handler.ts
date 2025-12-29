import { createLogger } from './logger';

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Standardized error handler for trading operations
 * Converts errors to consistent format and logs them
 */
export function handleTradingError(
  error: unknown,
  context: string,
  loggerName: string = 'trading'
): ErrorResponse {
  const log = createLogger(loggerName);
  const errorMessage = error instanceof Error ? error.message : String(error);

  log.error(context, { error: errorMessage });

  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ErrorResponse {
  return !response.success;
}

/**
 * Creates a success response
 */
export function createSuccessResponse<T>(data?: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Creates an error response without logging
 */
export function createErrorResponse(message: string): ErrorResponse {
  return {
    success: false,
    error: message,
  };
}