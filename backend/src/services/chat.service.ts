import { MessageRole, Prisma, ProcessType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

export interface CreateChatInput {
  userId: string;
  title?: string;
  processType?: ProcessType | null;
}

export interface ListChatsInput {
  userId: string;
  page: number;
  limit: number;
  processType?: ProcessType;
}

export interface SendMessageInput {
  userId: string;
  chatId: string;
  content: string;
  attachments?: string[];
}

function sanitizePage(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function sanitizeLimit(value: unknown, fallback: number, max = 50): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
}

export const chatService = {
  parsePagination(page: unknown, limit: unknown): { page: number; limit: number } {
    return {
      page: sanitizePage(page, 1),
      limit: sanitizeLimit(limit, 20),
    };
  },

  async createChat(input: CreateChatInput) {
    const title = input.title?.trim() || 'New Chat';

    return prisma.chat.create({
      data: {
        user_id: input.userId,
        title,
        process_type: input.processType ?? null,
      },
      select: {
        id: true,
        title: true,
        process_type: true,
        created_at: true,
        updated_at: true,
      },
    });
  },

  async listChats(input: ListChatsInput) {
    const where = {
      user_id: input.userId,
      ...(input.processType ? { process_type: input.processType } : {}),
    };

    const [total, chats] = await Promise.all([
      prisma.chat.count({ where }),
      prisma.chat.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        select: {
          id: true,
          title: true,
          process_type: true,
          created_at: true,
          updated_at: true,
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              content: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
    ]);

    return {
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        process_type: chat.process_type,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        message_count: chat._count.messages,
        last_message_preview: chat.messages[0]?.content?.slice(0, 120) ?? null,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / input.limit)),
      },
    };
  },

  async getChatForUser(chatId: string, userId: string) {
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
        process_type: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!chat) {
      throw new AppError(404, 'CHAT_NOT_FOUND', 'Chat not found');
    }

    return chat;
  },

  async getChatWithMessages(chatId: string, userId: string) {
    const chat = await this.getChatForUser(chatId, userId);
    const messages = await prisma.message.findMany({
      where: { chat_id: chatId },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        metadata: true,
        created_at: true,
      },
    });

    return { chat, messages };
  },

  async deleteChat(chatId: string, userId: string) {
    await this.getChatForUser(chatId, userId);

    await prisma.chat.delete({ where: { id: chatId } });
  },

  async saveUserMessage(input: SendMessageInput) {
    await this.getChatForUser(input.chatId, input.userId);

    return prisma.message.create({
      data: {
        chat_id: input.chatId,
        role: MessageRole.user,
        content: input.content,
        metadata: {
          attachments: input.attachments ?? [],
        },
      },
      select: {
        id: true,
        created_at: true,
      },
    });
  },

  async saveAssistantMessage(
    chatId: string,
    content: string,
    metadata?: Prisma.InputJsonValue
  ) {
    return prisma.message.create({
      data: {
        chat_id: chatId,
        role: MessageRole.assistant,
        content,
        metadata,
      },
      select: {
        id: true,
      },
    });
  },

  async getLatestAssistantMessage(chatId: string) {
    return prisma.message.findFirst({
      where: {
        chat_id: chatId,
        role: MessageRole.assistant,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        metadata: true,
      },
    });
  },
};
