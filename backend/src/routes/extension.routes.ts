import { Router } from 'express';
import { extensionController } from '../controllers/extension.controller';
import { authMiddleware } from '../middleware/auth';

export const extensionRoutes = Router();

extensionRoutes.get('/portals', authMiddleware, extensionController.listPortals);
extensionRoutes.get('/status/:portalKey', authMiddleware, extensionController.getStatus);
extensionRoutes.get('/autofill/:portalKey', authMiddleware, extensionController.getAutofill);
extensionRoutes.post('/export', authMiddleware, extensionController.exportFromForm);
