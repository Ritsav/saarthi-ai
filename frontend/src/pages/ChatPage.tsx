import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { loadChat, activeChat } = useChat();

  useEffect(() => {
    if (chatId) {
      void loadChat(chatId);
    }
  }, [chatId, loadChat]);

  const effectiveChatId = chatId || activeChat?.id || 'new';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
      <ChatInput chatId={effectiveChatId} />
    </div>
  );
}
