import { cn } from '@/lib/utils';

interface ReadinessGaugeProps {
  score: number;
  size?: number;
}

export function ReadinessGauge({ score, size = 180 }: ReadinessGaugeProps) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (score / 100) * circumference;
  const tone = score >= 85 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  const stroke = score >= 85 ? 'stroke-green-500' : score >= 60 ? 'stroke-amber-500' : 'stroke-red-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="50" cy="50" r={radius} fill="none" className={stroke} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={cn('text-4xl font-bold', tone)}>{score}%</p>
        <p className="text-xs uppercase tracking-wide text-slate-500">Readiness</p>
      </div>
    </div>
  );
}
