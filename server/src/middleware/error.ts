import { Request, Response, NextFunction } from 'express';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError, RateLimitError } from '../services/errors';
import { ZodError } from 'zod';

export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0].message });
  }

  const knownErrors = [ConflictError, UnauthorizedError, NotFoundError, BadRequestError, RateLimitError];
  for (const ErrClass of knownErrors) {
    if (err instanceof ErrClass) {
      return res.status((err as any).statusCode).json({ error: err.message });
    }
  }

  res.status(500).json({ error: 'Internal server error' });
}
