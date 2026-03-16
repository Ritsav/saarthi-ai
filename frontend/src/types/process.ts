import type { ProcessType } from './common';

export type RequirementStatus = 'complete' | 'missing' | 'invalid';

export interface Requirement {
  requirement: string;
  document_type: string;
  status: 'completed' | 'missing' | 'invalid';
  readiness_score: number;
  notes?: string;
  document_id?: string | null;
}

export interface ProcessInfo {
  type: ProcessType;
  name: string;
  description: string;
  portal_url: string;
  authority: string;
  estimated_time: string;
  government_fee: string;
}

export interface ChecklistResponse {
  process_type: ProcessType;
  overall_readiness: number;
  checklist: Requirement[];
}

export interface ReadinessSummary {
  score: number;
  complete: number;
  total: number;
}

export type OCRFieldStatus = 'confirmed' | 'needs_review' | 'missing' | 'low_confidence';

export interface OCRField {
  key: string;
  label: string;
  value: string;
  required: boolean;
  status: OCRFieldStatus;
  confidence: number;
}

export interface ProcessFormField {
  key: string;
  label: string;
  required: boolean;
  source: string;
  source_document_type: string;
  source_field: string;
  selector: string;
  selectors: string[];
  value: string;
  confidence: number | null;
  status: 'mapped' | 'missing';
  field_type?: 'text' | 'date' | 'radio' | 'select';
  options?: Array<{
    value: string;
    label: string;
    selector?: string;
  }>;
  approval_required?: boolean;
  form_step?: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
  section_title?: string;
}

export interface ProcessFormSection {
  id: string;
  title: string;
  fields: ProcessFormField[];
  completed: number;
  total: number;
}
