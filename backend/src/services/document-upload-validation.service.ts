import fs from 'node:fs/promises';
import path from 'node:path';
import { DocumentType } from '@prisma/client';
import { AppError } from '../utils/errors';

type DetectedMimeType = 'image/jpeg' | 'image/png' | 'application/pdf' | null;

interface ImageDimensions {
  width: number;
  height: number;
}

const MIME_BY_EXTENSION: Record<string, Exclude<DetectedMimeType, null>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

function detectMimeFromSignature(buffer: Buffer): DetectedMimeType {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return 'application/pdf';
  }

  return null;
}

function parsePngDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24) {
    return null;
  }

  const isIHDR =
    buffer[12] === 0x49 && buffer[13] === 0x48 && buffer[14] === 0x44 && buffer[15] === 0x52;
  if (!isIHDR) {
    return null;
  }

  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

function isStartOfFrameMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    offset += 2;

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
      continue;
    }

    if (marker >= 0xd0 && marker <= 0xd7) {
      continue;
    }

    if (offset + 1 >= buffer.length) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    if (isStartOfFrameMarker(marker)) {
      if (offset + 7 >= buffer.length) {
        return null;
      }

      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      if (width <= 0 || height <= 0) {
        return null;
      }

      return { width, height };
    }

    offset += segmentLength;
  }

  return null;
}

function parseImageDimensions(buffer: Buffer, mimeType: DetectedMimeType): ImageDimensions | null {
  if (mimeType === 'image/png') {
    return parsePngDimensions(buffer);
  }

  if (mimeType === 'image/jpeg') {
    return parseJpegDimensions(buffer);
  }

  return null;
}

function assertMimeConsistency(file: Express.Multer.File, detectedMimeType: DetectedMimeType): void {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMimeByExtension = MIME_BY_EXTENSION[extension];

  if (!expectedMimeByExtension) {
    throw new AppError(415, 'DOCUMENT_INVALID_TYPE', 'Only jpg, jpeg, png, and pdf files are allowed');
  }

  if (!detectedMimeType) {
    throw new AppError(415, 'DOCUMENT_SIGNATURE_INVALID', 'Unable to verify uploaded file format');
  }

  if (expectedMimeByExtension !== detectedMimeType) {
    throw new AppError(
      415,
      'DOCUMENT_EXTENSION_MISMATCH',
      'File extension does not match actual file content'
    );
  }

  if (file.mimetype !== detectedMimeType) {
    throw new AppError(
      415,
      'DOCUMENT_MIME_MISMATCH',
      'File MIME type does not match actual file content'
    );
  }
}

function assertPassportPhotoRequirements(file: Express.Multer.File, detectedMimeType: DetectedMimeType): void {
  if (detectedMimeType !== 'image/jpeg' && detectedMimeType !== 'image/png') {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_INVALID_FORMAT',
      'Passport photo must be uploaded as JPG or PNG image'
    );
  }

  if (file.size < 25 * 1024) {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_TOO_SMALL',
      'Passport photo file is too small. Upload a clearer high-quality image'
    );
  }
}

function assertPassportPhotoDimensions(dimensions: ImageDimensions | null): void {
  if (!dimensions) {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_DIMENSIONS_UNREADABLE',
      'Could not read passport photo dimensions'
    );
  }

  if (dimensions.width < 300 || dimensions.height < 380) {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_LOW_RESOLUTION',
      'Passport photo resolution is too low. Use at least 300x380 pixels'
    );
  }

  if (dimensions.width >= dimensions.height) {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_INVALID_ORIENTATION',
      'Passport photo must be portrait orientation (height greater than width)'
    );
  }

  const ratio = dimensions.width / dimensions.height;
  if (ratio < 0.68 || ratio > 0.82) {
    throw new AppError(
      422,
      'PASSPORT_PHOTO_INVALID_RATIO',
      'Passport photo aspect ratio must be close to 35:45'
    );
  }
}

function assertCitizenshipRequirements(file: Express.Multer.File, detectedMimeType: DetectedMimeType): void {
  if (!detectedMimeType) {
    throw new AppError(415, 'DOCUMENT_SIGNATURE_INVALID', 'Unable to verify uploaded file format');
  }

  if (detectedMimeType !== 'image/jpeg' && detectedMimeType !== 'image/png' && detectedMimeType !== 'application/pdf') {
    throw new AppError(
      422,
      'CITIZENSHIP_INVALID_FORMAT',
      'Citizenship document must be JPG, PNG, or PDF'
    );
  }

  if (file.size < 40 * 1024) {
    throw new AppError(
      422,
      'CITIZENSHIP_FILE_TOO_SMALL',
      'Citizenship document seems too small to read. Upload a clearer full document'
    );
  }
}

function assertCitizenshipDimensions(dimensions: ImageDimensions | null): void {
  if (!dimensions) {
    return;
  }

  if (dimensions.width < 600 || dimensions.height < 400) {
    throw new AppError(
      422,
      'CITIZENSHIP_LOW_RESOLUTION',
      'Citizenship document image resolution is too low for accurate verification'
    );
  }
}

export const documentUploadValidationService = {
  async validate(file: Express.Multer.File, documentType?: DocumentType): Promise<void> {
    const buffer = await fs.readFile(file.path);
    const detectedMimeType = detectMimeFromSignature(buffer);
    assertMimeConsistency(file, detectedMimeType);

    if (!documentType) {
      return;
    }

    if (documentType === DocumentType.PASSPORT_PHOTO) {
      assertPassportPhotoRequirements(file, detectedMimeType);
      const dimensions = parseImageDimensions(buffer, detectedMimeType);
      assertPassportPhotoDimensions(dimensions);
      return;
    }

    if (documentType === DocumentType.CITIZENSHIP) {
      assertCitizenshipRequirements(file, detectedMimeType);
      const dimensions = parseImageDimensions(buffer, detectedMimeType);
      assertCitizenshipDimensions(dimensions);
    }
  },
};
