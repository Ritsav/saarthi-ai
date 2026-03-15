import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import api from '@/config/api';
import i18n from '@/config/i18n';
import type { Chat, ChatAttachment, Message, ToolCall, ProcessType } from '@/types';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingToolCalls: ToolCall[];
}

interface ChatContextValue extends ChatState {
  createChat: (title?: string, processType?: ProcessType) => Promise<Chat>;
  loadChats: () => Promise<void>;
  loadChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  cancelStream: () => void;
  setActiveChatId: (chatId: string | null) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

function tempId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function mapChat(raw: any): Chat {
  return {
    id: raw.id,
    title: raw.title || 'New Chat',
    process_type: raw.process_type || null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    message_count: raw.message_count,
    last_message_preview: raw.last_message_preview,
  };
}

function mapMessage(raw: any): Message {
  return {
    id: raw.id,
    role: raw.role,
    content: raw.content,
    metadata: raw.metadata || null,
    created_at: raw.created_at,
  };
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>({
    chats: [],
    activeChat: null,
    messages: [],
    isStreaming: false,
    streamingContent: '',
    streamingToolCalls: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  const loadChats = useCallback(async () => {
    const token = localStorage.getItem('saarthi_token');
    if (!token) {
      setState((prev) => ({ ...prev, chats: [] }));
      return;
    }

    try {
      const response = await api.get('/api/chat');
      const chats = (response.data?.data?.chats || []).map(mapChat);
      setState((prev) => ({ ...prev, chats }));
    } catch {
      setState((prev) => ({ ...prev, chats: [] }));
    }
  }, []);

  useEffect(() => {
    void loadChats();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadChats]);

  const createChat = useCallback(async (title?: string, processType?: ProcessType) => {
    const response = await api.post('/api/chat', {
      title,
      process_type: processType,
    });

    const chat = mapChat(response.data?.data?.chat || response.data?.chat);
    setState((prev) => ({ ...prev, chats: [chat, ...prev.chats], activeChat: chat, messages: [] }));
    return chat;
  }, []);

  const loadChat = useCallback(async (chatId: string) => {
    const response = await api.get(`/api/chat/${chatId}`);
    const chat = mapChat(response.data?.data?.chat || response.data?.chat);
    const messages = (response.data?.data?.messages || response.data?.messages || []).map(mapMessage);

    setState((prev) => ({
      ...prev,
      activeChat: chat,
      messages,
      chats: prev.chats.some((item) => item.id === chat.id) ? prev.chats : [chat, ...prev.chats],
    }));
  }, []);

  const setActiveChatId = useCallback(
    (chatId: string | null) => {
      if (!chatId) {
        setState((prev) => ({ ...prev, activeChat: null, messages: [] }));
        return;
      }

      const localChat = state.chats.find((chat) => chat.id === chatId);
      if (localChat) {
        setState((prev) => ({ ...prev, activeChat: localChat }));
      }
    },
    [state.chats],
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      await api.delete(`/api/chat/${chatId}`);
      setState((prev) => {
        const chats = prev.chats.filter((chat) => chat.id !== chatId);
        const isActiveDeleted = prev.activeChat?.id === chatId;
        return {
          ...prev,
          chats,
          activeChat: isActiveDeleted ? null : prev.activeChat,
          messages: isActiveDeleted ? [] : prev.messages,
        };
      });
    },
    [],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((prev) => ({ ...prev, isStreaming: false, streamingContent: '', streamingToolCalls: [] }));
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      let activeChat = state.activeChat;
      if (!activeChat) {
        activeChat = await createChat();
      }

      if (!activeChat) return;

      let attachmentIds: string[] = [];
      let localAttachments: ChatAttachment[] = [];
      if (attachments?.length) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('chat_id', activeChat.id);

          const upload = await api.post('/api/document/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const uploadedDoc = upload.data?.data?.document;
          if (uploadedDoc?.id) {
            attachmentIds.push(uploadedDoc.id);
          }

          localAttachments.push({
            id: uploadedDoc?.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            url: URL.createObjectURL(file),
          });
        }
      }

      const userMessage: Message = {
        id: tempId('user'),
        role: 'user',
        content,
        attachments: localAttachments,
        created_at: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isStreaming: true,
        streamingContent: '',
        streamingToolCalls: [],
      }));

      const token = localStorage.getItem('saarthi_token');
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/chat/${activeChat.id}/message`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content,
            attachments: attachmentIds,
            language: i18n.language,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Failed to open response stream.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let finalMessageId = tempId('assistant');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.replace('event:', '').trim();
              continue;
            }

            if (!trimmed.startsWith('data:')) continue;

            let data: any;
            try {
              data = JSON.parse(trimmed.replace('data:', '').trim());
            } catch {
              continue;
            }

            if (currentEvent === 'token') {
              const nextContent = data.content || '';
              setState((prev) => ({ ...prev, streamingContent: `${prev.streamingContent}${nextContent}` }));
            }

            if (currentEvent === 'tool_call') {
              const tool = data.tool || 'tool';
              const status = data.status === 'completed' ? 'done' : 'running';
              setState((prev) => {
                const existingIndex = prev.streamingToolCalls.findIndex((item) => item.tool === tool && item.status !== 'done');
                if (existingIndex >= 0) {
                  const updated = [...prev.streamingToolCalls];
                  updated[existingIndex] = { ...updated[existingIndex], status, result: data.output };
                  return { ...prev, streamingToolCalls: updated };
                }

                return {
                  ...prev,
                  streamingToolCalls: [...prev.streamingToolCalls, { tool, status, input: data.input, result: data.output }],
                };
              });
            }

            if (currentEvent === 'intent') {
              setState((prev) => ({
                ...prev,
                streamingToolCalls: [...prev.streamingToolCalls],
              }));
            }

            if (currentEvent === 'done') {
              finalMessageId = data.message_id || finalMessageId;
            }

            if (currentEvent === 'error') {
              throw new Error(data.message || 'Streaming error');
            }
          }
        }

        setState((prev) => {
          const assistantMessage: Message = {
            id: finalMessageId,
            role: 'assistant',
            content: prev.streamingContent,
            metadata: prev.streamingToolCalls.length ? { tools_used: prev.streamingToolCalls } : null,
            created_at: new Date().toISOString(),
          };

          return {
            ...prev,
            messages: [...prev.messages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
            streamingToolCalls: [],
          };
        });

        await loadChats();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error((error as Error).message || 'Failed to send message.');
        }
        setState((prev) => ({ ...prev, isStreaming: false, streamingContent: '', streamingToolCalls: [] }));
      } finally {
        abortRef.current = null;
      }
    },
    [state.activeChat, createChat, loadChats],
  );

  const value = useMemo(
    () => ({ ...state, createChat, loadChats, loadChat, sendMessage, deleteChat, cancelStream, setActiveChatId }),
    [state, createChat, loadChats, loadChat, sendMessage, deleteChat, cancelStream, setActiveChatId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

