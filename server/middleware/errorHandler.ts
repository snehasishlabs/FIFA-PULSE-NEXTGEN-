import { Request, Response, NextFunction } from 'express';

/**
 * Custom application error class for throwing operational errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized Express error handling middleware.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Extract error details
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';

  // Handle specific well-known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err instanceof SyntaxError && 'status' in err && err.message.includes('JSON')) {
    statusCode = 400;
    message = 'Invalid JSON payload format.';
    code = 'BAD_REQUEST';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access.';
    code = 'UNAUTHORIZED';
  }

  // Prevent stack traces from leaking in production
  const isProduction = process.env.NODE_ENV === 'production';
  const response: { success: boolean; message: string; code?: string; stack?: string } = {
    success: false,
    message: isProduction && statusCode === 500 ? 'An unexpected server error occurred' : message,
  };

  if (code) {
    response.code = code;
  }

  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  // Log error (critical ones as error, operational as info/warn)
  if (statusCode === 500) {
    console.error(`[ERROR] Uncaught 500 Error: ${err.message || err}`, err.stack || '');
  } else {
    console.warn(`[WARN] Operational Error (${statusCode}): ${message}`);
  }

  res.status(statusCode).json(response);
}

/**
 * Sets up global handlers for uncaught exceptions and unhandled promise rejections.
 */
export function setupProcessHandlers(): void {
  process.on('uncaughtException', (err: Error) => {
    console.error('FATAL [uncaughtException]:', err.message || err);
    console.error(err.stack || 'No stack trace available');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('FATAL [unhandledRejection] at:', promise, 'reason:', reason);
    if (reason instanceof Error) {
      console.error(reason.stack || 'No stack trace available');
    }
  });
}
