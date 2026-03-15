import 'express';
import type { SafeUser } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: SafeUser;
    }
  }
}

export {};
