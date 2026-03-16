import { AlertTriangle, CheckCircle2, CircleDashed, PencilLine } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OCRField } from '@/types';

interface OCRFieldMeta {
  fieldType: 'text' | 'date' | 'radio' | 'select';
  options: Array<{ value: string; label: string; selector?: string }>;
  approvalRequired: boolean;
}

interface OCRFieldReviewProps {
  field: OCRField;
  meta?: OCRFieldMeta;
  onChange: (value: string) => void;
  onConfirm: () => void;
  compact?: boolean;
}

export function OCRFieldReview({ field, meta, onChange, onConfirm, compact = false }: OCRFieldReviewProps) {
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
    <div className={cn('rounded-xl border border-slate-200', compact ? 'p-2.5' : 'p-3')}>
      <div className={cn('flex items-center justify-between gap-2', compact ? 'mb-1.5' : 'mb-2')}>
        <p className={cn('flex items-center gap-2 font-medium text-slate-800', compact ? 'text-xs' : 'text-sm')}>
          {field.label}
          {meta?.approvalRequired ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              approve
            </span>
          ) : null}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full font-medium',
            compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
            statusTone
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {field.status.replace('_', ' ')}
        </span>
      </div>

      {meta?.fieldType === 'radio' && meta.options.length > 0 ? (
        <div
          className={cn(
            'grid rounded-xl border border-slate-200 bg-slate-50',
            compact ? 'gap-1.5 p-2 sm:grid-cols-2' : 'gap-2 p-3'
          )}
        >
          {meta.options.map((option) => (
            <label
              key={`${field.key}:${option.value}`}
              className={cn('flex cursor-pointer items-center gap-2 text-slate-700', compact ? 'text-xs' : 'text-sm')}
            >
              <input
                type="radio"
                name={`ocr-${field.key}`}
                value={option.value}
                checked={field.value === option.value}
                onChange={(event) => onChange(event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : meta?.fieldType === 'select' ? (
        <select
          value={field.value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full border border-slate-300 bg-white px-3',
            compact ? 'h-9 rounded-lg text-xs' : 'h-10 rounded-xl text-sm'
          )}
        >
          <option value="">Select an option</option>
          {meta.options.map((option) => (
            <option key={`${field.key}:${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          type={meta?.fieldType === 'date' ? 'date' : 'text'}
          value={field.value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(compact ? 'h-9 rounded-lg text-sm' : 'rounded-xl')}
        />
      )}

      <div className={cn('flex items-center justify-between', compact ? 'mt-1.5' : 'mt-2')}>
        <p className={cn('text-slate-500', compact ? 'text-[11px]' : 'text-xs')}>
          Confidence {(field.confidence * 100).toFixed(0)}%
        </p>
        <Button
          size="sm"
          variant="outline"
          className={cn(compact ? 'h-8 rounded-lg px-2 text-xs' : 'rounded-xl')}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
