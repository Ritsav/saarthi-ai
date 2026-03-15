import { Router } from 'express';
import { sendSuccess } from '../utils/response';

export const documentRoutes = Router();

documentRoutes.get('/_placeholder', (_req, res) => {
  sendSuccess(res, { module: 'document', status: 'phase_pending' });
});
