import { DocumentStatus, DocumentType } from '@prisma/client';
import { documentService } from '../document.service';
import { storageService } from '../storage.service';
import { AppError } from '../../utils/errors';
import { geminiVisionService } from './gemini-vision';
import { ocrExtractor } from './extractor';
import { ocrValidator } from './validator';
import { logger } from '../../utils/logger';

const SUPPORTED_DOCUMENT_TYPES = new Set<DocumentType>([
  DocumentType.CITIZENSHIP,
  DocumentType.PASSPORT_PHOTO,
  DocumentType.PAN_CERTIFICATE,
]);

export const ocrProcessor = {
  async analyzeDocument(
    documentId: string,
    userId: string,
    onStatus?: (event: { stage: string; status: string; details?: Record<string, unknown> }) => void
  ) {
    onStatus?.({ stage: 'analyze', status: 'started' });
    const document = await documentService.getDocumentForUser(documentId, userId);

    onStatus?.({ stage: 'lookup', status: 'completed' });

    if (!SUPPORTED_DOCUMENT_TYPES.has(document.document_type)) {
      throw new AppError(
        422,
        'UNSUPPORTED_DOCUMENT_TYPE_FOR_ANALYSIS',
        `Document type ${document.document_type} is not supported for analysis yet`
      );
    }

    if (document.status === DocumentStatus.PROCESSING) {
      throw new AppError(409, 'DOCUMENT_ALREADY_PROCESSING', 'Document is already being processed');
    }

    await documentService.markStatus(document.id, DocumentStatus.PROCESSING);
    onStatus?.({ stage: 'status_update', status: 'processing' });

    try {
      const absolutePath = storageService.toAbsolutePath(document.file_path);
      onStatus?.({ stage: 'ocr', status: 'started' });
      const rawText = await geminiVisionService.extractRawText(
        absolutePath,
        document.file_type,
        document.document_type
      );
      onStatus?.({ stage: 'ocr', status: 'completed' });

      onStatus?.({ stage: 'extract', status: 'started' });
      const extracted = await ocrExtractor.extractFromRawText(rawText, document.document_type);
      onStatus?.({ stage: 'extract', status: 'completed' });

      onStatus?.({ stage: 'validate', status: 'started' });
      const validation = ocrValidator.validate(document.document_type, extracted);
      onStatus?.({ stage: 'validate', status: 'completed' });

      await documentService.saveAnalysisSuccess(document.id, extracted, validation);
      onStatus?.({ stage: 'persist', status: 'completed' });
      onStatus?.({ stage: 'analyze', status: 'completed' });

      return {
        document_id: document.id,
        status: DocumentStatus.COMPLETED,
        ocr_result: extracted,
        validation_result: validation,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown analysis error';
      await documentService.saveAnalysisFailure(document.id, message);
      logger.warn(
        {
          documentId,
          userId,
          code: 'DOCUMENT_ANALYSIS_FAILED',
        },
        'Document analysis failed'
      );
      onStatus?.({ stage: 'analyze', status: 'failed', details: { message } });
      throw error;
    }
  },
};
