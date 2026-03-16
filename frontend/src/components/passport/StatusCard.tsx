import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatusCard({ label, value, description, icon, className }: StatusCardProps) {
  return (
    <article className={cn("rounded-2xl border p-4 shadow-sm", className || "border-slate-200 bg-white")}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </article>
  );
}
