import type { ProcessType } from './common';

export type DocumentStatus = 'pending' | 'analyzing' | 'analyzed' | 'error';

export interface ExtractedField {
  name: string;
  value: string;
  status: 'present' | 'missing' | 'low_confidence';
}

export interface DocumentAnalysis {
  fields?: ExtractedField[];
  warnings?: string[];
  suggestions?: string[];
  readiness_score?: number;
}

export interface DocumentItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  process_type: ProcessType | null;
  document_type?: string;
  status: DocumentStatus;
  created_at: string;
  preview_url?: string;
  thumbnail_url?: string;
  validation_result?: DocumentAnalysis;
}

export interface UploadResponse {
  document: DocumentItem;
}
