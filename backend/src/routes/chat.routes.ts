import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';
import { sendSuccess } from '../utils/response';

export const chatRoutes = Router();

chatRoutes.post('/', authMiddleware, chatController.create);
chatRoutes.get('/', authMiddleware, chatController.list);
chatRoutes.get('/:id', authMiddleware, chatController.getById);
chatRoutes.delete('/:id', authMiddleware, chatController.remove);
chatRoutes.post('/:id/message', authMiddleware, chatController.sendMessage);

chatRoutes.post('/:id/speech', authMiddleware, (_req, res) => {
  sendSuccess(res, {
    module: 'chat-speech',
    status: 'phase_pending',
    planned_phase: 'phase-10-speech-to-text',
  });
});
