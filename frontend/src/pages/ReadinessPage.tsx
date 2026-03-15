import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileWarning, ShieldCheck } from 'lucide-react';
import { NEXT_STEP_TIMELINE } from '../data/passportContent';
import { useProcess } from '@/hooks/useProcess';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { ReadinessGauge } from '@/components/passport/ReadinessGauge';
import { NextStepTimeline } from '@/components/passport/NextStepTimeline';
import { OfficialPortalCard } from '@/components/passport/OfficialPortalCard';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';

function readinessLabel(score: number) {
  if (score >= 85) return 'Ready to proceed';
  if (score >= 60) return 'Almost ready';
  return 'Not ready';
}

export default function ReadinessPage() {
  const { readinessScore, requirements, portalUrl } = useProcess('PASSPORT_APPLICATION');
  const { documents } = useDocuments();
  const { missingFields, formCompletion } = usePassportFormData();

  const documentIssues = documents.filter((doc) => doc.status === 'error').length;
  const checklistMissing = requirements.filter((item) => item.status !== 'completed').length;
  const combinedScore = Math.round((readinessScore.score + formCompletion.percentage) / 2);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Passport Readiness Results</h1>
        <p className="mt-2 text-sm text-slate-600">Your final preparation check before proceeding to Nepal official passport portal.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
              <ReadinessGauge score={combinedScore} size={220} />
              <div className="space-y-3 text-sm text-slate-700">
                <p className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{readinessLabel(combinedScore)}</p>
                <p>Checklist completion: {readinessScore.complete}/{readinessScore.total}</p>
                <p>Form completion: {formCompletion.percentage}%</p>
                <p>Missing fields: {missingFields.length}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <FileWarning className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold">Missing Items</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">{checklistMissing}</p>
              <p className="text-sm text-slate-600">Required documents still pending.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h3 className="text-sm font-semibold">Issues Detected</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900">{documentIssues + missingFields.length}</p>
              <p className="text-sm text-slate-600">Field or file quality issues to fix.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold">AI Suggestions</h3>
              </div>
              <p className="text-sm text-slate-600">Your citizenship document looks valid. Add issue date and verify photo quality.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Portal Readiness</h3>
              </div>
              <p className="text-sm text-slate-600">Proceed only when readiness reaches "Ready to proceed".</p>
            </div>
          </div>

          <NextStepTimeline items={NEXT_STEP_TIMELINE} />
        </div>

        <aside className="space-y-4">
          <AlertNotice
            tone={combinedScore >= 85 ? 'success' : 'warning'}
            title={combinedScore >= 85 ? 'You are almost ready to proceed' : 'We found a few things to fix before you continue'}
            description={combinedScore >= 85 ? 'Final review done. You can continue to official portal.' : 'Complete missing details and re-check your photo quality.'}
          />

          <AlertNotice tone="info" title="Document pass/fail summary" description={`Valid documents: ${documents.length - documentIssues} | Needs review: ${documentIssues + (missingFields.length > 0 ? 1 : 0)}`} />

          <OfficialPortalCard href={portalUrl || '#'} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Quick actions</h3>
            <div className="mt-3 space-y-2">
              <Button asChild variant="outline" className="w-full rounded-xl justify-start">
                <Link to="/documents">Review uploaded documents</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl justify-start">
                <Link to="/ocr-review">Review extracted fields</Link>
              </Button>
              <Button asChild className="w-full rounded-xl bg-slate-900 justify-start hover:bg-slate-800">
                <Link to="/form-preview">Open form preview</Link>
              </Button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

