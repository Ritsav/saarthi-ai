import { useState } from 'react';
import { Eye, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import type { DocumentItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AnalysisResult } from './AnalysisResult';

interface DocumentCardProps {
  document: DocumentItem;
  view?: 'grid' | 'list';
  onDelete?: (id: string) => Promise<void>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  analyzing: 'bg-blue-100 text-blue-700',
  analyzed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
};

export function DocumentCard({ document, view = 'grid', onDelete }: DocumentCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (view === 'list') {
    return (
      <>
        <Card className="p-3">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{document.file_name}</p>
              <p className="text-xs text-slate-500">{formatDate(document.created_at)}</p>
            </div>
            <Badge variant="outline">{document.process_type || 'GENERAL'}</Badge>
            <Badge className={statusColors[document.status]}>{document.status}</Badge>
            <Button variant="ghost" size="icon" onClick={() => setShowAnalysis(true)}>
              <Eye className="h-4 w-4" />
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="icon" onClick={() => void onDelete(document.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            ) : null}
          </div>
        </Card>
        <AnalysisResult document={document} open={showAnalysis} onClose={setShowAnalysis} />
      </>
    );
  }

  return (
    <>
      <Card className="cursor-pointer overflow-hidden transition-shadow hover:shadow-md" onClick={() => setShowAnalysis(true)}>
        <div className="relative aspect-[3/4] bg-slate-100">
          {document.file_type.startsWith('image/') && (document.thumbnail_url || document.preview_url) ? (
            <img src={document.thumbnail_url || document.preview_url} alt={document.file_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FileText className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <Badge className={cn('absolute right-2 top-2 text-xs', statusColors[document.status])}>{document.status}</Badge>
        </div>

        <CardContent className="space-y-1 p-3">
          <p className="truncate text-sm font-medium">{document.file_name}</p>
          <p className="text-xs text-slate-500">{formatDate(document.created_at)}</p>

          {onDelete ? (
            <Button
              variant="ghost"
              className="mt-1 h-8 w-full justify-start px-2 text-red-600 hover:text-red-700"
              onClick={(event) => {
                event.stopPropagation();
                void onDelete(document.id);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <AnalysisResult document={document} open={showAnalysis} onClose={setShowAnalysis} />
    </>
  );
}
