import { Router } from 'express';
import { sendSuccess } from '../utils/response';

export const chatRoutes = Router();

chatRoutes.get('/_placeholder', (_req, res) => {
  sendSuccess(res, { module: 'chat', status: 'phase_pending' });
});
