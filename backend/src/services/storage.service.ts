import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);
const baseUploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
const documentsUploadDir = path.join(baseUploadDir, 'documents');

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export const storageService = {
  getBaseUploadDir(): string {
    return baseUploadDir;
  },

  getDocumentsUploadDir(): string {
    return documentsUploadDir;
  },

  async ensureDirectory(directoryPath: string): Promise<void> {
    await fs.mkdir(directoryPath, { recursive: true });
  },

  isAllowedExtension(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return ALLOWED_EXTENSIONS.has(extension);
  },

  generateStoredFilename(originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const basename = path.basename(originalName, extension);
    const safeBase = sanitizeFilename(basename).slice(0, 80) || 'document';
    const random = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}-${safeBase}-${random}${extension}`;
  },

  toRelativePath(absolutePath: string): string {
    const relativePath = path.relative(baseUploadDir, absolutePath).split(path.sep).join('/');
    if (relativePath.startsWith('..')) {
      throw new AppError(500, 'UPLOAD_PATH_ERROR', 'Stored upload path is invalid');
    }

    return relativePath;
  },

  toAbsolutePath(relativePath: string): string {
    const absolutePath = path.resolve(baseUploadDir, relativePath);
    if (absolutePath !== baseUploadDir && !absolutePath.startsWith(`${baseUploadDir}${path.sep}`)) {
      throw new AppError(500, 'INVALID_DOCUMENT_PATH', 'Invalid stored document path');
    }

    return absolutePath;
  },

  async removeFileIfExists(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        throw error;
      }
    }
  },
};
