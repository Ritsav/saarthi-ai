import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useChat } from '@/hooks/useChat';
import { EmptyState } from '@/components/common/EmptyState';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';

export function ChatWindow() {
  const { t } = useTranslation();
  const { messages, isStreaming, streamingContent, streamingToolCalls, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const suggestions = [
    t('chat.suggestions.company'),
    t('chat.suggestions.pan'),
    t('chat.suggestions.passport'),
  ];

  return (
    <ScrollArea className="h-full px-4 py-4 md:px-6">
      {messages.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7 text-primary" />}
          message={t('chat.start_prompt')}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" onClick={() => void sendMessage(suggestion)}>
                  {suggestion}
                </Button>
              ))}
            </div>
          }
        />
      ) : null}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isStreaming ? (
        <>
          {streamingContent ? <StreamingMessage content={streamingContent} toolCalls={streamingToolCalls} /> : <p className="mb-3 text-sm text-slate-500">{t('chat.streaming')}</p>}
          <Separator className="my-3" />
        </>
      ) : null}

      <div ref={scrollRef} />
    </ScrollArea>
  );
}
