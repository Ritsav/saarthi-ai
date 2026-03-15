import { Router } from 'express';
import { sendSuccess } from '../utils/response';

export const processRoutes = Router();

processRoutes.get('/_placeholder', (_req, res) => {
  sendSuccess(res, { module: 'process', status: 'phase_pending' });
});
