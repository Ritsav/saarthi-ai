import { useCallback, useEffect, useState } from 'react';
import api from '@/config/api';
import type { DocumentItem, ProcessType } from '@/types';

interface UseDocumentsReturn {
  documents: DocumentItem[];
  isLoading: boolean;
  listDocuments: (processType?: ProcessType) => Promise<void>;
  uploadDocument: (file: File, processType?: ProcessType, chatId?: string, onProgress?: (progress: number) => void) => Promise<DocumentItem>;
  analyzeDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
}

function mapDocument(raw: any): DocumentItem {
  const hasAnalysis = Boolean(raw.has_ocr_result || raw.validation_result);
  return {
    id: raw.id,
    file_name: raw.file_name,
    file_type: raw.file_type,
    file_size: raw.file_size,
    process_type: raw.process_type || null,
    document_type: raw.document_type,
    status: raw.status || (hasAnalysis ? 'analyzed' : 'pending'),
    created_at: raw.created_at,
    thumbnail_url: raw.thumbnail_url,
    preview_url: raw.preview_url,
    validation_result: raw.validation_result,
  };
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const listDocuments = useCallback(async (processType?: ProcessType) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/document', {
        params: processType ? { process_type: processType } : undefined,
      });
      const docs = (response.data?.data?.documents || []).map(mapDocument);
      setDocuments(docs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void listDocuments();
  }, [listDocuments]);

  const uploadDocument = useCallback(
    async (file: File, processType?: ProcessType, chatId?: string, onProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append('file', file);
      if (processType) formData.append('process_type', processType);
      if (chatId) formData.append('chat_id', chatId);

      const response = await api.post('/api/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!onProgress || !evt.total) return;
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });

      const document = mapDocument(response.data?.data?.document || response.data?.document);
      setDocuments((prev) => [document, ...prev]);
      return document;
    },
    [],
  );

  const analyzeDocument = useCallback(async (documentId: string) => {
    await api.post(`/api/document/${documentId}/analyze`);
    await listDocuments();
  }, [listDocuments]);

  const deleteDocument = useCallback(async (documentId: string) => {
    await api.delete(`/api/document/${documentId}`);
    setDocuments((prev) => prev.filter((document) => document.id !== documentId));
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
