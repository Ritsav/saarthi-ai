import { ProcessType } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { chatService } from '../services/chat.service';
import { EchoResponder } from '../services/chat-responder';
import { sendSuccess } from '../utils/response';
import { setupSSE, sendSSEEvent, startHeartbeat } from '../utils/sse';

const createChatSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  process_type: z.nativeEnum(ProcessType).nullable().optional(),
});

const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  attachments: z.array(z.string().uuid()).optional(),
});

const processTypeParamSchema = z.nativeEnum(ProcessType);

const echoResponder = new EchoResponder();

export const chatController = {
  async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const parsed = createChatSchema.parse(req.body ?? {});

    const chat = await chatService.createChat({
      userId,
      title: parsed.title,
      processType: parsed.process_type,
    });

    sendSuccess(res, { chat }, 201);
  },

  async list(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { page, limit } = chatService.parsePagination(req.query.page, req.query.limit);

    let processType: ProcessType | undefined;
    if (typeof req.query.process_type === 'string' && req.query.process_type.trim().length > 0) {
      processType = processTypeParamSchema.parse(req.query.process_type);
    }

    const data = await chatService.listChats({
      userId,
      page,
      limit,
      processType,
    });

    sendSuccess(res, data);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const chatId = req.params.id;

    const data = await chatService.getChatWithMessages(chatId, userId);
    sendSuccess(res, data);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const chatId = req.params.id;

    await chatService.deleteChat(chatId, userId);
    sendSuccess(res, { message: 'Chat deleted successfully' });
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const chatId = req.params.id;
    const parsed = messageSchema.parse(req.body ?? {});

    const chat = await chatService.getChatForUser(chatId, userId);

    await chatService.saveUserMessage({
      userId,
      chatId,
      content: parsed.content,
      attachments: parsed.attachments,
    });

    setupSSE(res);
    const heartbeat = startHeartbeat(res);

    let disconnected = false;
    req.on('close', () => {
      disconnected = true;
      clearInterval(heartbeat);
    });

    let fullResponse = '';
    let usedFallback = false;

    try {
      for await (const chunk of echoResponder.streamResponse({
        userMessage: parsed.content,
        processType: chat.process_type,
      })) {
        if (disconnected) {
          break;
        }
        usedFallback = usedFallback || chunk.fallbackUsed;
        fullResponse += chunk.content;
        sendSSEEvent(res, 'token', { content: chunk.content });
      }
    } catch (error) {
      sendSSEEvent(res, 'error', {
        message: 'Failed to process chat message',
        code: 'CHAT_RESPONSE_ERROR',
      });
    }

    if (fullResponse.trim().length > 0) {
      const saved = await chatService.saveAssistantMessage(chatId, fullResponse, {
        responder: echoResponder.name,
        phase: 'phase-4-chat-core',
        llm_provider: 'gemini',
        fallback_used: usedFallback,
      });

      if (!disconnected) {
        sendSSEEvent(res, 'done', { message_id: saved.id });
      }
    }

    clearInterval(heartbeat);
    if (!disconnected) {
      res.end();
    }
  },
};
