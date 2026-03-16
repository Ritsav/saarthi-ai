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
  fields_invalid?: string[];
}

export interface OCRPreview {
  name?: string | null;
  date_of_birth?: string | null;
  citizenship_number?: string | null;
}

export interface DocumentItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  process_type: ProcessType | null;
  document_type?: string;
  status: DocumentStatus;
  processing_error?: string | null;
  ocr_preview?: OCRPreview | null;
  created_at: string;
  preview_url?: string;
  thumbnail_url?: string;
  validation_result?: DocumentAnalysis;
}

export interface UploadResponse {
  document: DocumentItem;
}
