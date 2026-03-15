import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Requirement } from '@/types';

interface RequirementsListProps {
  requirements: Requirement[];
}

function normalizeStatus(status: Requirement['status']) {
  if (status === 'completed') return 'complete';
  if (status === 'invalid') return 'invalid';
  return 'missing';
}

export function RequirementsList({ requirements }: RequirementsListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {requirements.map((req, index) => {
        const status = normalizeStatus(req.status);
        return (
          <div key={index} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-3">
              {status === 'complete' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : null}
              {status === 'missing' ? <XCircle className="h-5 w-5 text-red-500" /> : null}
              {status === 'invalid' ? <AlertCircle className="h-5 w-5 text-amber-500" /> : null}
              <span className="text-sm">{req.requirement}</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={status === 'complete' ? 'default' : status === 'invalid' ? 'secondary' : 'destructive'}>{t(`readiness.${status}`)}</Badge>
              {status !== 'complete' ? <Button variant="outline" size="sm">{status === 'invalid' ? t('document.re_upload') : t('document.upload')}</Button> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
