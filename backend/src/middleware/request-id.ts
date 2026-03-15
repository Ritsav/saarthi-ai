import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.header('X-Request-ID');
  const requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}
