import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(
      {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        code: err.code,
      },
      err.message
    );

    res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof Error) {
    logger.error(
      {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        stack: err.stack,
      },
      err.message
    );
  } else {
    logger.error(
      {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      },
      'Unknown error'
    );
  }

  res.status(500).json({
    error: true,
    message: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR',
  });
}
