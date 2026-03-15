import { Eye, RefreshCcw } from 'lucide-react';
import type { DocumentItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ValidationBadge } from './ValidationBadge';

interface PassportFileCardProps {
  document: DocumentItem;
  onReview?: () => void;
  onRetry?: () => void;
}

function mapStatus(status: string): 'valid' | 'needs_review' | 'missing' | 'expired' | 'low_quality' | 'wrong_format' {
  if (status === 'analyzed') return 'valid';
  if (status === 'error') return 'needs_review';
  return 'needs_review';
}

export function PassportFileCard({ document, onReview, onRetry }: PassportFileCardProps) {
  const preview = document.thumbnail_url || document.preview_url;
  const isPdf = document.file_type?.toLowerCase() === 'application/pdf';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 overflow-hidden rounded-xl bg-slate-100">
        {preview ? (
          isPdf ? (
            <iframe src={preview} title={document.file_name} className="h-36 w-full" />
          ) : (
            <img src={preview} alt={document.file_name} className="h-36 w-full object-cover" />
          )
        ) : (
          <div className="flex h-36 items-center justify-center text-sm text-slate-500">No preview</div>
        )}
      </div>

      <div className="space-y-2">
        <p className="truncate text-sm font-medium text-slate-800">{document.file_name}</p>
        <ValidationBadge state={mapStatus(document.status)} />
        {document.status === 'error' && document.processing_error ? (
          <p className="line-clamp-2 text-xs text-red-600" title={document.processing_error}>
            {document.processing_error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onReview}>
            <Eye className="mr-2 h-3.5 w-3.5" />
            Review
          </Button>
          <Button variant="ghost" size="sm" className="rounded-xl" onClick={onRetry}>
            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
            Retry OCR
          </Button>
        </div>
      </div>
    </div>
  );
}
