import { FileText, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/utils/formatters';
import type { ChatAttachment } from '@/types';

interface FilePreviewProps {
  file: File | ChatAttachment;
  onRemove?: () => void;
  compact?: boolean;
}

function getFileName(file: File | ChatAttachment): string {
  return file instanceof File ? file.name : file.file_name;
}

function getFileType(file: File | ChatAttachment): string {
  return file instanceof File ? file.type : file.file_type;
}

function getFileSize(file: File | ChatAttachment): number | undefined {
  return file instanceof File ? file.size : file.file_size;
}

export function FilePreview({ file, onRemove, compact = false }: FilePreviewProps) {
  const fileType = getFileType(file);
  const fileName = getFileName(file);
  const fileSize = getFileSize(file);
  const isImage = fileType.startsWith('image/');
  const imageUrl = file instanceof File ? URL.createObjectURL(file) : file.url;

  return (
    <div className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 ${compact ? 'max-w-[220px]' : 'w-full'}`}>
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100">
        {isImage && imageUrl ? <img src={imageUrl} alt={fileName} className="h-full w-full object-cover" /> : <FileText className="h-5 w-5 text-slate-500" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{fileName}</p>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          {isImage ? <ImageIcon className="h-3 w-3" /> : null}
          {fileSize ? <span>{formatFileSize(fileSize)}</span> : null}
        </div>
      </div>
      {onRemove ? (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
          <X className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  );
}
