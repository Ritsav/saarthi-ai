import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authMiddleware } from '../middleware/auth';
import { documentUpload, handleUploadError } from '../middleware/upload';
import { storageService } from '../services/storage.service';

export const documentRoutes = Router();

documentRoutes.post('/upload', authMiddleware, (req, res, next) => {
  documentUpload.single('file')(req, res, (error) => {
    if (error) {
      try {
        handleUploadError(error);
      } catch (handledError) {
        if (req.file?.path) {
          void storageService.removeFileIfExists(req.file.path);
        }
        next(handledError);
      }
      return;
    }

    void documentController.upload(req, res).catch(next);
  });
});

documentRoutes.get('/', authMiddleware, documentController.list);
documentRoutes.get('/:id', authMiddleware, documentController.getById);
documentRoutes.delete('/:id', authMiddleware, documentController.remove);
documentRoutes.post('/:id/analyze', authMiddleware, documentController.analyze);
