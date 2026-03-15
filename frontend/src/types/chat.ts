import type { ProcessType } from './common';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCall {
  tool: string;
  status?: 'running' | 'done';
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface MessageMetadata {
  tools_used?: ToolCall[];
  sources?: string[];
  intent?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  attachments?: ChatAttachment[];
  metadata?: MessageMetadata | null;
  created_at?: string;
}

export interface ChatAttachment {
  id?: string;
  file_name: string;
  file_type: string;
  file_size?: number;
  url?: string;
}

export interface Chat {
  id: string;
  title: string;
  process_type: ProcessType | null;
  created_at: string;
  updated_at?: string;
  message_count?: number;
  last_message_preview?: string;
}

export interface ChatDetailResponse {
  chat: Chat;
  messages: Message[];
}
