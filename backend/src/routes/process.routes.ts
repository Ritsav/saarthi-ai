import { Router } from 'express';
import { processController } from '../controllers/process.controller';
import { authMiddleware } from '../middleware/auth';

export const processRoutes = Router();

processRoutes.get('/', authMiddleware, processController.list);
processRoutes.get('/:processType/checklist', authMiddleware, processController.checklist);
processRoutes.get('/:processType/form', authMiddleware, processController.formDefinition);
