import { Request, Response } from 'express';
import {
  documentIdParamSchema,
  listDocumentsQuerySchema,
  uploadDocumentBodySchema,
} from '../schemas/document.schema';
import { documentService } from '../services/document.service';
import { storageService } from '../services/storage.service';
import { ocrProcessor } from '../services/ocr/processor';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { setupSSE, sendSSEEvent, startHeartbeat } from '../utils/sse';

export const documentController = {
  async upload(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const parsedBody = uploadDocumentBodySchema.parse(req.body ?? {});

    if (!req.file) {
      throw new AppError(400, 'DOCUMENT_REQUIRED', 'A document file is required');
    }

    let document;
    try {
      document = await documentService.createDocument({
        userId,
        file: req.file,
        chatId: parsedBody.chat_id,
        documentType: parsedBody.document_type,
        processType: parsedBody.process_type,
      });
    } catch (error) {
      await storageService.removeFileIfExists(req.file.path);
      throw error;
    }

    sendSuccess(res, { document }, 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const parsedQuery = listDocumentsQuerySchema.parse(req.query ?? {});

    const data = await documentService.listDocuments({
      userId,
      page: parsedQuery.page,
      limit: parsedQuery.limit,
      documentType: parsedQuery.document_type,
      processType: parsedQuery.process_type,
      status: parsedQuery.status,
      chatId: parsedQuery.chat_id,
    });

    sendSuccess(res, data);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = documentIdParamSchema.parse(req.params);

    const document = await documentService.getDocumentById(id, userId);
    sendSuccess(res, { document });
  },

  async remove(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = documentIdParamSchema.parse(req.params);

    await documentService.deleteDocument(id, userId);
    sendSuccess(res, { message: 'Document deleted successfully' });
  },

  async analyze(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = documentIdParamSchema.parse(req.params);

    const acceptsSSE = typeof req.headers.accept === 'string' && req.headers.accept.includes('text/event-stream');

    if (acceptsSSE) {
      setupSSE(res);
      const heartbeat = startHeartbeat(res);
      let disconnected = false;

      req.on('close', () => {
        disconnected = true;
        clearInterval(heartbeat);
      });

      try {
        const result = await ocrProcessor.analyzeDocument(id, userId, (event) => {
          if (!disconnected) {
            sendSSEEvent(res, 'status', event);
          }
        });

        if (!disconnected) {
          sendSSEEvent(res, 'done', result);
          res.end();
        }
      } catch (error) {
        if (!disconnected) {
          sendSSEEvent(res, 'error', {
            message: error instanceof Error ? error.message : 'Document analysis failed',
            code: 'DOCUMENT_ANALYSIS_FAILED',
          });
          res.end();
        }
      } finally {
        clearInterval(heartbeat);
      }

      return;
    }

    const result = await ocrProcessor.analyzeDocument(id, userId);
    sendSuccess(res, result);
  },
};
