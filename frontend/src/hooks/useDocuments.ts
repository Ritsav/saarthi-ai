import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/config/api';
import type { DocumentItem, ProcessType } from '@/types';

interface UseDocumentsReturn {
  documents: DocumentItem[];
  isLoading: boolean;
  listDocuments: (processType?: ProcessType) => Promise<void>;
  uploadDocument: (
    file: File,
    processType?: ProcessType,
    documentType?: 'CITIZENSHIP' | 'PASSPORT_PHOTO' | 'OTHER',
    chatId?: string,
    onProgress?: (progress: number) => void
  ) => Promise<DocumentItem>;
  analyzeDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

function mapDocument(raw: any): DocumentItem {
  const normalizedStatus = String(raw.status || '').toUpperCase();
  const mappedStatus =
    normalizedStatus === 'COMPLETED'
      ? 'analyzed'
      : normalizedStatus === 'PROCESSING'
        ? 'analyzing'
        : normalizedStatus === 'FAILED'
          ? 'error'
          : 'pending';

  const hasAnalysis = Boolean(raw.has_ocr_result || raw.validation_result);
  return {
    id: raw.id,
    file_name: raw.file_name,
    file_type: raw.file_type,
    file_size: raw.file_size,
    process_type: raw.process_type || null,
    document_type: raw.document_type,
    status: mappedStatus || (hasAnalysis ? 'analyzed' : 'pending'),
    processing_error: raw.processing_error || null,
    ocr_preview: raw.ocr_preview || null,
    created_at: raw.created_at,
    thumbnail_url: raw.thumbnail_url,
    preview_url: raw.preview_url,
    validation_result: raw.validation_result,
  };
}

function isPreviewable(fileType: string | undefined): boolean {
  if (!fileType) {
    return false;
  }

  const normalized = fileType.toLowerCase();
  return normalized.startsWith('image/') || normalized === 'application/pdf';
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  const revokePreviewUrl = useCallback((documentId: string) => {
    const existing = previewUrlsRef.current.get(documentId);
    if (existing) {
      URL.revokeObjectURL(existing);
      previewUrlsRef.current.delete(documentId);
    }
  }, []);

  const reconcilePreviewCache = useCallback((nextDocuments: DocumentItem[]) => {
    const nextIds = new Set(nextDocuments.map((document) => document.id));
    for (const [documentId, objectUrl] of previewUrlsRef.current.entries()) {
      if (!nextIds.has(documentId)) {
        URL.revokeObjectURL(objectUrl);
        previewUrlsRef.current.delete(documentId);
      }
    }
  }, []);

  const attachPreviewUrls = useCallback(
    async (items: DocumentItem[]) => {
      const withPreviews = await Promise.all(
        items.map(async (document) => {
          if (!isPreviewable(document.file_type)) {
            return document;
          }

          const cached = previewUrlsRef.current.get(document.id);
          if (cached) {
            return { ...document, preview_url: cached, thumbnail_url: cached };
          }

          try {
            const response = await api.get(`/api/document/${document.id}/file`, {
              responseType: 'blob',
            });
            const objectUrl = URL.createObjectURL(response.data);
            previewUrlsRef.current.set(document.id, objectUrl);
            return {
              ...document,
              preview_url: objectUrl,
              thumbnail_url: objectUrl,
            };
          } catch {
            return document;
          }
        })
      );

      reconcilePreviewCache(withPreviews);
      return withPreviews;
    },
    [reconcilePreviewCache]
  );

  const listDocuments = useCallback(async (processType?: ProcessType) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/document', {
        params: processType ? { process_type: processType } : undefined,
      });
      const docs = (response.data?.data?.documents || []).map(mapDocument);
      const hydrated = await attachPreviewUrls(docs);
      setDocuments(hydrated);
    } finally {
      setIsLoading(false);
    }
  }, [attachPreviewUrls]);

  useEffect(() => {
    void listDocuments();
  }, [listDocuments]);

  const uploadDocument = useCallback(
    async (
      file: File,
      processType?: ProcessType,
      documentType?: 'CITIZENSHIP' | 'PASSPORT_PHOTO' | 'OTHER',
      chatId?: string,
      onProgress?: (progress: number) => void
    ) => {
      const formData = new FormData();
      formData.append('file', file);
      if (processType) formData.append('process_type', processType);
      if (documentType) formData.append('document_type', documentType);
      if (chatId) formData.append('chat_id', chatId);

      const response = await api.post('/api/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!onProgress || !evt.total) return;
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const document = mapDocument(response.data?.data?.document || response.data?.document);
      const hydrated = await attachPreviewUrls([document]);
      const nextDocument = hydrated[0];
      setDocuments((prev) => [nextDocument, ...prev]);
      return nextDocument;
    },
    [attachPreviewUrls],
  );

  const analyzeDocument = useCallback(async (documentId: string) => {
    await api.post(`/api/document/${documentId}/analyze`);
    await listDocuments();
  }, [listDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    await api.delete(`/api/document/${documentId}`);
    revokePreviewUrl(documentId);
    setDocuments((prev) => prev.filter((document) => document.id !== documentId));
  }, [revokePreviewUrl]);

  useEffect(() => {
    return () => {
      for (const objectUrl of previewUrlsRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      previewUrlsRef.current.clear();
    };
  }, []);

  return {
    documents,
    isLoading,
    listDocuments,
    uploadDocument,
    analyzeDocument,
    deleteDocument,
  };
}
