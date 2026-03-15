import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ValidationState = 'valid' | 'needs_review' | 'missing' | 'expired' | 'low_quality' | 'wrong_format';

const styles: Record<ValidationState, string> = {
  valid: 'bg-green-50 text-green-700 border-green-200',
  needs_review: 'bg-amber-50 text-amber-700 border-amber-200',
  missing: 'bg-slate-100 text-slate-700 border-slate-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  low_quality: 'bg-amber-50 text-amber-700 border-amber-200',
  wrong_format: 'bg-red-50 text-red-700 border-red-200',
};

const labels: Record<ValidationState, string> = {
  valid: 'Valid',
  needs_review: 'Needs review',
  missing: 'Missing information',
  expired: 'Expired',
  low_quality: 'Low quality image',
  wrong_format: 'Wrong format',
};

export function ValidationBadge({ state }: { state: ValidationState }) {
  return <Badge className={cn('rounded-full border px-3 py-1 text-xs font-medium', styles[state])}>{labels[state]}</Badge>;
}
