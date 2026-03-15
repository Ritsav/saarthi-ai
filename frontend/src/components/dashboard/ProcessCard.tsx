import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { ProcessType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessCardProps {
  processType: ProcessType;
  readinessScore: number;
}

export function ProcessCard({ processType, readinessScore }: ProcessCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const color = readinessScore >= 71 ? 'border-l-green-500' : readinessScore >= 41 ? 'border-l-amber-500' : 'border-l-red-500';

  return (
    <Card className={cn('cursor-pointer border-l-4 transition-shadow hover:shadow-md', color)} onClick={() => navigate(`/dashboard/${processType}`)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t(`process.${processType}`)}</p>
            <p className="text-xs text-slate-500">
              {readinessScore}% {t('readiness.score').toLowerCase()}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}
