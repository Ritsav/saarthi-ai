import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { storageService } from '../services/storage.service';

const allowedMimes = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

const baseUploadDir = storageService.getBaseUploadDir();
const documentsUploadDir = storageService.getDocumentsUploadDir();

const diskStorage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await storageService.ensureDirectory(documentsUploadDir);
      cb(null, documentsUploadDir);
    } catch (error) {
      cb(error as Error, documentsUploadDir);
    }
  },
  filename: (_req, file, cb) => {
    try {
      const filename = storageService.generateStoredFilename(file.originalname);
      cb(null, filename);
    } catch (error) {
      cb(error as Error, file.originalname);
    }
  },
});

function uploadFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (!allowedMimes.has(file.mimetype) || !storageService.isAllowedExtension(file.originalname)) {
    cb(new AppError(415, 'DOCUMENT_INVALID_TYPE', 'Only jpg, png, and pdf files are allowed'));
    return;
  }

  cb(null, true);
}

export const documentUpload = multer({
  storage: diskStorage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: uploadFileFilter,
});

export function handleUploadError(error: unknown): never {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new AppError(
        413,
        'DOCUMENT_TOO_LARGE',
        `Document exceeds ${env.MAX_FILE_SIZE_MB}MB size limit`
      );
    }

    throw new AppError(400, 'UPLOAD_ERROR', error.message);
  }

  throw error;
}

export const uploadPaths = {
  baseUploadDir,
  documentsUploadDir,
};
