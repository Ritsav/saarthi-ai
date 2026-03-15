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
