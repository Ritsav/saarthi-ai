import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type NoticeTone = 'info' | 'success' | 'warning';

const toneStyles: Record<NoticeTone, { wrapper: string; icon: ReactNode }> = {
  info: {
    wrapper: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: <Info className="h-4 w-4" />,
  },
  success: {
    wrapper: 'border-green-200 bg-green-50 text-green-800',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function AlertNotice({ tone = 'info', title, description }: { tone?: NoticeTone; title: string; description: string }) {
  return (
    <div className={cn('rounded-xl border p-3', toneStyles[tone].wrapper)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{toneStyles[tone].icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
