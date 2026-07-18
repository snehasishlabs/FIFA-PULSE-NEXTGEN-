import { Response } from 'express';

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Sends a standardized success response.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: any): void {
  const responseBody: StandardResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  res.status(statusCode).json(responseBody);
}

/**
 * Sends a standardized error response.
 */
export function sendError(res: Response, error: string, statusCode = 400): void {
  const responseBody: StandardResponse<never> = {
    success: false,
    error,
  };
  res.status(statusCode).json(responseBody);
}

/**
 * Safe string input sanitization to scrub potentially malicious tags or scripts.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip script tags
    .replace(/[<>]/g, '') // replace angle brackets
    .trim();
}

/**
 * Safely parses integer values with fallback.
 */
export function parseIntParam(value: any, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
