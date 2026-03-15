import { createWorker } from 'tesseract.js';

function canRunLocalImageOCR(mimeType: string): boolean {
  return mimeType.toLowerCase().startsWith('image/');
}

export const localOCRService = {
  canRun(mimeType: string): boolean {
    return canRunLocalImageOCR(mimeType);
  },

  async extractRawTextFromImage(absoluteFilePath: string): Promise<string> {
    const worker = await createWorker('eng');

    try {
      const result = await worker.recognize(absoluteFilePath);
      return result.data.text.trim();
    } finally {
      await worker.terminate();
    }
  },
};
