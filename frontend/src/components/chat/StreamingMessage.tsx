import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ToolCall } from '@/types';
import { ToolCallCard } from './ToolCallCard';

interface StreamingMessageProps {
  content: string;
  toolCalls?: ToolCall[];
}

export function StreamingMessage({ content, toolCalls }: StreamingMessageProps) {
  return (
    <div className="mb-4 flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-slate-800 text-white">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[85%] rounded-lg bg-slate-100 px-4 py-2 md:max-w-[75%]">
        {toolCalls?.map((toolCall, index) => (
          <ToolCallCard key={`${toolCall.tool}-${index}`} tool={toolCall.tool} status={toolCall.status} />
        ))}
        <div className="markdown prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-slate-400 align-middle" />
        </div>
      </div>
    </div>
  );
}
