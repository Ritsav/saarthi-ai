import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendError } from '../utils/response';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    sendError(res, 'Authentication required', 'UNAUTHORIZED', 401);
    return;
  }

  try {
    const payload = authService.verifyToken(token);
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      sendError(res, 'User no longer exists', 'USER_NOT_FOUND', 401);
      return;
    }

    req.user = user;
    next();
  } catch (_error) {
    sendError(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
  }
}
