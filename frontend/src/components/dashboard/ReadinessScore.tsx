import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ReadinessScoreProps {
  score: number;
  complete: number;
  total: number;
}

export function ReadinessScore({ score, complete, total }: ReadinessScoreProps) {
  const { t } = useTranslation();
  const color = score >= 71 ? 'text-green-500' : score >= 41 ? 'text-amber-500' : 'text-red-500';
  const strokeColor = score >= 71 ? 'stroke-green-500' : score >= 41 ? 'stroke-amber-500' : 'stroke-red-500';

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-3xl font-bold', color)}>{score}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {complete}/{total} {t('readiness.documents_ready')}
      </p>
    </div>
  );
}
