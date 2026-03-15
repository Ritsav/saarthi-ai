import { Router } from 'express';
import { sendSuccess } from '../utils/response';

export const authRoutes = Router();

authRoutes.get('/_placeholder', (_req, res) => {
  sendSuccess(res, { module: 'auth', status: 'phase_pending' });
});
