import { Router } from 'express';
import { autofillController } from '../controllers/autofill.controller';
import { authMiddleware } from '../middleware/auth';

export const autofillRoutes = Router();

autofillRoutes.get('/:processType', authMiddleware, autofillController.getByProcessType);
