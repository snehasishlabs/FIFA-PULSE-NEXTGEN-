import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
import { sanitizeInput, sendError } from '../utils/helpers';

// Memory store for rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Custom memory-based rate limiting middleware.
 * Prevents rapid-fire API spam without external storage dependencies.
 */
export function rateLimiter(limit = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const clientKey = `${String(ip)}:${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(clientKey);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(clientKey, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > limit) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      sendError(res, "Too many requests. Please slow down.", 429);
      return;
    }

    next();
  };
}

/**
 * Secure security headers middleware.
 * Implements basic security practices similar to helmet.js.
 */
export function secureHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
  next();
}

/**
 * Reusable input sanitizer middleware.
 * Deep-sanitizes string values in req.body.
 */
export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj: any): any => {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === 'string') {
          sanitized[key] = sanitizeInput(val);
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
          sanitized[key] = sanitizeObject(val);
        } else if (Array.isArray(val)) {
          sanitized[key] = val.map(item => typeof item === 'object' ? sanitizeObject(item) : typeof item === 'string' ? sanitizeInput(item) : item);
        } else {
          sanitized[key] = val;
        }
      }
      return sanitized;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Reusable Zod body validation middleware.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Validation Failed",
        details: parsed.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

/**
 * Global API Error Boundary Middleware.
 * Catches unhandled asynchronous or execution errors safely and logs them.
 */
export function errorBoundary(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error("Unhandled Backend Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message || 'Server Error';
  sendError(res, message, status);
}
