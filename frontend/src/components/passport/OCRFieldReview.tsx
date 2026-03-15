import { AlertTriangle, CheckCircle2, CircleDashed, PencilLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OCRField } from '@/types';

interface OCRFieldReviewProps {
  field: OCRField;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

export function OCRFieldReview({ field, onChange, onConfirm }: OCRFieldReviewProps) {
  const statusTone = {
    confirmed: 'text-green-600 bg-green-50',
    needs_review: 'text-amber-700 bg-amber-50',
    missing: 'text-slate-600 bg-slate-100',
    low_confidence: 'text-red-700 bg-red-50',
  }[field.status];

  const Icon = {
    confirmed: CheckCircle2,
    needs_review: PencilLine,
    missing: CircleDashed,
    low_confidence: AlertTriangle,
  }[field.status];

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">{field.label}</p>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', statusTone)}>
          <Icon className="h-3.5 w-3.5" />
          {field.status.replace('_', ' ')}
        </span>
      </div>
      <Input value={field.value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">Confidence {(field.confidence * 100).toFixed(0)}%</p>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
