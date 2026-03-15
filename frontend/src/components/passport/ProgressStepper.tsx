import { cn } from '@/lib/utils';

interface ProgressStepperProps {
  steps: readonly string[];
  current: number;
}

export function ProgressStepper({ steps, current }: ProgressStepperProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const active = index <= current;
          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500',
                )}
              >
                {index + 1}
              </div>
              <span className={cn('text-xs md:text-sm', active ? 'text-slate-800' : 'text-slate-500')}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
