import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { storageService } from './storage.service';

let cleanupTimer: NodeJS.Timeout | null = null;

async function removeExpiredFiles(now: Date): Promise<number> {
  const thresholdMs = env.FILE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const thresholdDate = new Date(now.getTime() - thresholdMs);

  const staleDocuments = await prisma.document.findMany({
    where: {
      created_at: {
        lt: thresholdDate,
      },
      status: {
        in: ['FAILED'],
      },
    },
    select: {
      id: true,
      file_path: true,
    },
    take: 200,
  });

  for (const document of staleDocuments) {
    const absolutePath = storageService.toAbsolutePath(document.file_path);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        logger.warn({ documentId: document.id }, 'Failed to remove stale file');
      }
    }
  }

  return staleDocuments.length;
}

async function pruneOrphanFiles(): Promise<number> {
  const uploadsDir = storageService.getDocumentsUploadDir();

  let fileNames: string[] = [];
  try {
    fileNames = await fs.readdir(uploadsDir);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }

  if (fileNames.length === 0) {
    return 0;
  }

  const relativePaths = fileNames.map((name) => path.posix.join('documents', name));

  const linkedDocuments = await prisma.document.findMany({
    where: {
      file_path: {
        in: relativePaths,
      },
    },
    select: {
      file_path: true,
    },
  });

  const linkedSet = new Set(linkedDocuments.map((item) => item.file_path));
  const orphanPaths = relativePaths.filter((filePath) => !linkedSet.has(filePath));

  for (const orphanPath of orphanPaths) {
    const absolutePath = storageService.toAbsolutePath(orphanPath);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') {
        logger.warn({ filePath: orphanPath }, 'Failed to remove orphan file');
      }
    }
  }

  return orphanPaths.length;
}

async function runCleanupCycle(): Promise<void> {
  const now = new Date();
  const [expiredRemoved, orphanRemoved] = await Promise.all([
    removeExpiredFiles(now),
    pruneOrphanFiles(),
  ]);

  if (expiredRemoved > 0 || orphanRemoved > 0) {
    logger.info(
      {
        expiredRemoved,
        orphanRemoved,
      },
      'File cleanup cycle completed'
    );
  }
}

export function startFileCleanupScheduler(): void {
  if (!env.FILE_CLEANUP_ENABLED) {
    logger.info('File cleanup scheduler disabled');
    return;
  }

  if (cleanupTimer) {
    return;
  }

  const intervalMs = env.FILE_CLEANUP_INTERVAL_MINUTES * 60 * 1000;

  cleanupTimer = setInterval(() => {
    void runCleanupCycle().catch((error) => {
      logger.error(
        {
          message: error instanceof Error ? error.message : 'Unknown cleanup error',
        },
        'File cleanup cycle failed'
      );
    });
  }, intervalMs);

  void runCleanupCycle().catch((error) => {
    logger.error(
      {
        message: error instanceof Error ? error.message : 'Unknown cleanup error',
      },
      'Initial file cleanup run failed'
    );
  });

  logger.info(
    {
      retentionDays: env.FILE_RETENTION_DAYS,
      intervalMinutes: env.FILE_CLEANUP_INTERVAL_MINUTES,
    },
    'File cleanup scheduler started'
  );
}
