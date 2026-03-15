import { AlertTriangle, Check, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocumentItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AnalysisResultProps {
  document: DocumentItem;
  open: boolean;
  onClose: (open: boolean) => void;
}

export function AnalysisResult({ document, open, onClose }: AnalysisResultProps) {
  const { t } = useTranslation();
  const analysis = document.validation_result;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('document.analysis_complete')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {document.preview_url || document.thumbnail_url ? (
              <img src={document.preview_url || document.thumbnail_url} alt={document.file_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-64 items-center justify-center">
                <FileText className="h-12 w-12 text-slate-300" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Extracted Fields</h4>
              <div className="space-y-2">
                {analysis?.fields?.length ? (
                  analysis.fields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{field.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{field.value || '-'}</span>
                        {field.status === 'present' ? <Check className="h-3 w-3 text-green-500" /> : null}
                        {field.status === 'missing' ? <X className="h-3 w-3 text-red-500" /> : null}
                        {field.status === 'low_confidence' ? <AlertTriangle className="h-3 w-3 text-amber-500" /> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No extracted data found yet.</p>
                )}
              </div>
            </div>

            {analysis?.warnings?.length ? (
              <div className="rounded-lg bg-amber-50 p-3">
                <h4 className="mb-1 font-medium text-amber-800">Warnings</h4>
                <ul className="space-y-1 text-sm text-amber-700">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index}>- {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {analysis?.suggestions?.length ? (
              <div className="rounded-lg bg-blue-50 p-3">
                <h4 className="mb-1 font-medium text-blue-800">Suggestions</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index}>- {suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
