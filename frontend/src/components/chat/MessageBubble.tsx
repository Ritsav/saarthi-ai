import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ToolCallCard } from './ToolCallCard';
import { FilePreview } from './FilePreview';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('mb-4 flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? 'bg-primary text-white' : 'bg-slate-800 text-white'}>{isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</AvatarFallback>
      </Avatar>

      <div className={cn('max-w-[85%] rounded-lg px-4 py-2 md:max-w-[75%]', isUser ? 'bg-primary text-white' : 'bg-white shadow-sm border border-slate-200')}>
        {message.metadata?.tools_used?.map((tool, index) => (
          <ToolCallCard key={`${tool.tool}-${index}`} tool={tool.tool} status={tool.status} />
        ))}

        <div className={cn('markdown prose prose-sm max-w-none', isUser ? 'prose-invert' : 'text-slate-800')}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className={isUser ? 'text-white underline' : 'text-blue-600 underline'}>
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.attachments?.length ? (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <FilePreview key={`${attachment.file_name}-${index}`} file={attachment} compact />
            ))}
          </div>
        ) : null}

        {message.metadata?.sources?.length ? (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <span className="text-xs text-slate-500">Sources:</span>
            {message.metadata.sources.map((url, index) => (
              <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-blue-600 underline">
                {url}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
