import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Loader2, Mic, MicOff, Paperclip, Send, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChat } from '@/hooks/useChat';
import { useSpeech } from '@/hooks/useSpeech';
import { validateFiles } from '@/utils/validators';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FilePreview } from './FilePreview';

interface ChatInputProps {
  chatId: string;
}

export function ChatInput({ chatId }: ChatInputProps) {
  const { t } = useTranslation();
  const { sendMessage, isStreaming, cancelStream } = useChat();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isProcessing, transcript, duration, startRecording, stopRecording, clearTranscript } = useSpeech(chatId);

  useEffect(() => {
    if (transcript) {
      setText((prev) => `${prev}${prev ? ' ' : ''}${transcript}`);
      clearTranscript();
    }
  }, [transcript, clearTranscript]);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = 'auto';
    textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;
    await sendMessage(text.trim(), attachments);
    setText('');
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const { valid } = validateFiles(files);
    setAttachments((prev) => [...prev, ...valid]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <TooltipProvider>
      <div className="border-t border-slate-200 bg-white p-4">
        {attachments.length ? (
          <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attachments.map((file, index) => (
              <FilePreview key={`${file.name}-${index}`} file={file} onRemove={() => removeAttachment(index)} />
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isStreaming} onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>

          <input ref={fileInputRef} type="file" hidden accept=".jpg,.jpeg,.png,.pdf" multiple onChange={handleFilesSelected} />

          <Textarea
            ref={textAreaRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            className="max-h-[120px] min-h-[40px] flex-1 resize-none"
            disabled={isStreaming}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? 'destructive' : 'ghost'}
                size="icon"
                disabled={isStreaming || isProcessing}
                onClick={() => {
                  if (isRecording) {
                    void stopRecording();
                  } else {
                    void startRecording();
                  }
                }}
              >
                {isRecording ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRecording ? t('speech.stop') : t('speech.start')}</TooltipContent>
          </Tooltip>

          {isStreaming ? (
            <Button variant="destructive" onClick={cancelStream}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => void handleSend()} disabled={!text.trim() && attachments.length === 0}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isRecording ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
            <span className="text-xs text-slate-500">Tap to stop</span>
          </div>
        ) : null}

        {isProcessing ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('speech.processing')}</span>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
