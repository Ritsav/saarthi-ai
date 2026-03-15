import {
  DocumentStatus,
  DocumentType,
  Prisma,
  ProcessType,
} from '@prisma/client';
import { prisma } from '../config/database';
import { storageService } from './storage.service';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

interface CreateDocumentInput {
  userId: string;
  file: Express.Multer.File;
  chatId?: string;
  documentType?: DocumentType;
  processType?: ProcessType;
}

interface ListDocumentsInput {
  userId: string;
  page: number;
  limit: number;
  documentType?: DocumentType;
  processType?: ProcessType;
  status?: DocumentStatus;
  chatId?: string;
}

function extractReadinessScore(value: Prisma.JsonValue | null): number | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  if (typeof data.readinessScore === 'number') {
    return data.readinessScore;
  }

  if (typeof data.readiness_score === 'number') {
    return data.readiness_score;
  }

  return null;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export const documentService = {
  async createDocument(input: CreateDocumentInput) {
    if (input.chatId) {
      const chat = await prisma.chat.findFirst({
        where: {
          id: input.chatId,
          user_id: input.userId,
        },
        select: { id: true },
      });

      if (!chat) {
        throw new AppError(404, 'CHAT_NOT_FOUND', 'Chat not found');
      }
    }

    const relativePath = storageService.toRelativePath(input.file.path);

    return prisma.document.create({
      data: {
        user_id: input.userId,
        chat_id: input.chatId ?? null,
        file_path: relativePath,
        file_name: input.file.originalname,
        file_type: input.file.mimetype,
        file_size: input.file.size,
        document_type: input.documentType ?? DocumentType.OTHER,
        process_type: input.processType ?? null,
      },
      select: {
        id: true,
        file_name: true,
        file_type: true,
        file_size: true,
        document_type: true,
        process_type: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });
  },

  async listDocuments(input: ListDocumentsInput) {
    const where: Prisma.DocumentWhereInput = {
      user_id: input.userId,
      ...(input.documentType ? { document_type: input.documentType } : {}),
      ...(input.processType ? { process_type: input.processType } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.chatId ? { chat_id: input.chatId } : {}),
    };

    const [total, documents] = await Promise.all([
      prisma.document.count({ where }),
      prisma.document.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          id: true,
          file_name: true,
          file_type: true,
          file_size: true,
          document_type: true,
          process_type: true,
          status: true,
          ocr_result: true,
          validation_result: true,
          created_at: true,
          processed_at: true,
          updated_at: true,
        },
      }),
    ]);

    return {
      documents: documents.map((document) => ({
        id: document.id,
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        document_type: document.document_type,
        process_type: document.process_type,
        status: document.status,
        has_ocr_result: document.ocr_result !== null,
        readiness_score: extractReadinessScore(document.validation_result),
        created_at: document.created_at,
        processed_at: document.processed_at,
        updated_at: document.updated_at,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  },

  async getDocumentForUser(documentId: string, userId: string) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        user_id: userId,
      },
    });

    if (!document) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    return document;
  },

  async getDocumentById(documentId: string, userId: string) {
    const document = await this.getDocumentForUser(documentId, userId);

    return {
      id: document.id,
      file_name: document.file_name,
      file_type: document.file_type,
      file_size: document.file_size,
      document_type: document.document_type,
      process_type: document.process_type,
      status: document.status,
      processing_error: document.processing_error,
      ocr_result: document.ocr_result,
      validation_result: document.validation_result,
      created_at: document.created_at,
      processed_at: document.processed_at,
      updated_at: document.updated_at,
    };
  },

  async getDocumentFileForUser(documentId: string, userId: string) {
    const document = await this.getDocumentForUser(documentId, userId);
    const absolutePath = storageService.toAbsolutePath(document.file_path);

    return {
      absolutePath,
      fileName: document.file_name,
      fileType: document.file_type,
    };
  },

  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.getDocumentForUser(documentId, userId);
    const absolutePath = storageService.toAbsolutePath(document.file_path);

    await prisma.document.delete({ where: { id: document.id } });

    try {
      await storageService.removeFileIfExists(absolutePath);
    } catch (error) {
      logger.warn(
        {
          documentId: document.id,
          userId,
        },
        'Document deleted but file cleanup failed'
      );
    }
  },

  async markStatus(documentId: string, status: DocumentStatus, processingError?: string | null) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        status,
        processing_error: processingError ?? null,
        processed_at:
          status === DocumentStatus.COMPLETED || status === DocumentStatus.FAILED
            ? new Date()
            : null,
      },
    });
  },

  async saveAnalysisSuccess(
    documentId: string,
    ocrResult: unknown,
    validationResult: unknown
  ) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.COMPLETED,
        processing_error: null,
        ocr_result: toJsonValue(ocrResult),
        validation_result: toJsonValue(validationResult),
        processed_at: new Date(),
      },
    });
  },

  async saveAnalysisFailure(documentId: string, processingError: string) {
    return prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.FAILED,
        processing_error: processingError.slice(0, 191),
        processed_at: new Date(),
      },
    });
  },
};
