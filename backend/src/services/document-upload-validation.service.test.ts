import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DocumentType } from '@prisma/client';
import { documentUploadValidationService } from './document-upload-validation.service';

const tempPaths: string[] = [];

function makeJpegWithSof0(width: number, height: number): Buffer {
  const app0 = Buffer.from([
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
  ]);
  const sof0 = Buffer.from([
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00,
  ]);
  const sos = Buffer.from([
    0xff,
    0xda,
    0x00,
    0x08,
    0x01,
    0x01,
    0x00,
    0x00,
    0x3f,
    0x00,
    0x00,
    0x00,
    0xff,
    0xd9,
  ]);

  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof0, sos]);
}

function makePng(width: number, height: number): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrLength = Buffer.from([0x00, 0x00, 0x00, 0x0d]);
  const ihdrType = Buffer.from([0x49, 0x48, 0x44, 0x52]);
  const ihdrData = Buffer.from([
    (width >> 24) & 0xff,
    (width >> 16) & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    (height >> 24) & 0xff,
    (height >> 16) & 0xff,
    (height >> 8) & 0xff,
    height & 0xff,
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
  ]);
  const fakeCrc = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  return Buffer.concat([signature, ihdrLength, ihdrType, ihdrData, fakeCrc]);
}

async function writeTempFile(name: string, content: Buffer): Promise<string> {
  const filePath = path.join(os.tmpdir(), `saarthi-upload-validation-${Date.now()}-${Math.random().toString(16).slice(2)}-${name}`);
  await fs.writeFile(filePath, content);
  tempPaths.push(filePath);
  return filePath;
}

function makeMulterFile(params: {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: params.originalname,
    encoding: '7bit',
    mimetype: params.mimetype,
    size: params.size,
    destination: path.dirname(params.path),
    filename: path.basename(params.path),
    path: params.path,
    buffer: Buffer.alloc(0),
    stream: undefined as never,
  };
}

afterEach(async () => {
  await Promise.all(
    tempPaths.splice(0, tempPaths.length).map(async (filePath) => {
      await fs.unlink(filePath).catch(() => undefined);
    })
  );
});

describe('documentUploadValidationService', () => {
  it('accepts valid passport photo image', async () => {
    const jpeg = makeJpegWithSof0(700, 900);
    const padded = Buffer.concat([jpeg, Buffer.alloc(40 * 1024)]);
    const filePath = await writeTempFile('passport.jpg', padded);
    const file = makeMulterFile({
      path: filePath,
      originalname: 'passport.jpg',
      mimetype: 'image/jpeg',
      size: padded.length,
    });

    await expect(
      documentUploadValidationService.validate(file, DocumentType.PASSPORT_PHOTO)
    ).resolves.toBeUndefined();
  });

  it('rejects passport photo with invalid aspect ratio', async () => {
    const jpeg = makeJpegWithSof0(1000, 1000);
    const padded = Buffer.concat([jpeg, Buffer.alloc(35 * 1024)]);
    const filePath = await writeTempFile('passport-square.jpg', padded);
    const file = makeMulterFile({
      path: filePath,
      originalname: 'passport-square.jpg',
      mimetype: 'image/jpeg',
      size: padded.length,
    });

    await expect(
      documentUploadValidationService.validate(file, DocumentType.PASSPORT_PHOTO)
    ).rejects.toMatchObject({ code: 'PASSPORT_PHOTO_INVALID_ORIENTATION' });
  });

  it('rejects mismatched extension and content', async () => {
    const png = makePng(800, 1000);
    const filePath = await writeTempFile('citizenship.jpg', png);
    const file = makeMulterFile({
      path: filePath,
      originalname: 'citizenship.jpg',
      mimetype: 'image/jpeg',
      size: png.length + 45 * 1024,
    });

    await expect(
      documentUploadValidationService.validate(file, DocumentType.CITIZENSHIP)
    ).rejects.toMatchObject({ code: 'DOCUMENT_EXTENSION_MISMATCH' });
  });

  it('rejects very small citizenship files', async () => {
    const png = makePng(700, 500);
    const filePath = await writeTempFile('citizenship.png', png);
    const file = makeMulterFile({
      path: filePath,
      originalname: 'citizenship.png',
      mimetype: 'image/png',
      size: 10 * 1024,
    });

    await expect(
      documentUploadValidationService.validate(file, DocumentType.CITIZENSHIP)
    ).rejects.toMatchObject({ code: 'CITIZENSHIP_FILE_TOO_SMALL' });
  });
});
