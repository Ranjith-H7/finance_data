import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { AppError } from './errorHandler.js';

interface ValidationSchemas {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}

const normalizeQuery = (query: Request['query']) => {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      normalized[key] = value[0];
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === undefined) {
      normalized[key] = value;
      continue;
    }

    normalized[key] = String(value);
  }

  return normalized;
};

export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request['params'];
      }
      if (schemas.query) {
        req.query = schemas.query.parse(normalizeQuery(req.query)) as Request['query'];
      }
      next();
    } catch (error) {
      const issues = error && typeof error === 'object' && 'issues' in error
        ? (error as { issues?: Array<{ message: string; path: Array<string | number> }> }).issues
        : undefined;

      const message = issues?.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') || 'Invalid request payload';
      next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
  };
};
