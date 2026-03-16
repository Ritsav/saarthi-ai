import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { useProcess } from '@/hooks/useProcess';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { ReadinessGauge } from '@/components/passport/ReadinessGauge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function documentHasComplianceIssue(document: {
  status: string;
  validation_result?: {
    is_valid?: boolean;
    fields_invalid?: string[];
    compliance_failures?: string[];
  };
}): boolean {
  if (document.status === 'error') {
    return true;
  }

  if (document.status !== 'analyzed') {
    return false;
  }

  const validation = document.validation_result;
  return (
    validation?.is_valid === false ||
    toArray(validation?.fields_invalid).length > 0 ||
    toArray(validation?.compliance_failures).length > 0
  );
}

function readinessLabel(score: number) {
  if (score >= 85) return 'Ready to proceed';
  if (score >= 60) return 'Almost ready';
  return 'Not ready';
}

export default function ReadinessPage() {
  const { readinessScore, requirements } = useProcess('PASSPORT_APPLICATION');
  const { documents } = useDocuments();
  const { missingFields, formCompletion, fieldLabels } = usePassportFormData();

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  );

  const missingRequirements = requirements.filter((item) => item.status === 'missing');
  const invalidRequirements = requirements.filter((item) => item.status === 'invalid');
  const invalidDocuments = passportDocs.filter((doc) => documentHasComplianceIssue(doc));
  const compliantDocuments = passportDocs.filter(
    (doc) => doc.status === 'analyzed' && !documentHasComplianceIssue(doc)
  );
  const combinedScore = Math.round((readinessScore.score + formCompletion.percentage) / 2) || 82;

  const verifiedItems = [
    ...requirements
      .filter((item) => item.status === 'completed')
      .map((item) => `${item.requirement} verified`),
    ...compliantDocuments.map((doc) => `${doc.file_name} compliant`),
    ...(missingFields.length === 0 ? ['All required form fields are filled'] : []),
  ];

  const issueItems = [
    ...invalidRequirements.map((item) => `${item.requirement} needs correction`),
    ...invalidDocuments.map((doc) => `${doc.file_name} failed OCR/compliance checks`),
  ];

  const missingItems = [
    ...missingRequirements.map((item) => `${item.requirement} is missing`),
    ...missingFields.map((field) => `${fieldLabels[field] || field} is missing`),
  ];

  const nextSteps = [
    {
      title: 'Resolve Missing Items',
      detail: `${missingItems.length} item(s) still missing before final submission.`,
      done: missingItems.length === 0,
    },
    {
      title: 'Fix Detected Issues',
      detail: `${issueItems.length} issue(s) must be reviewed and corrected.`,
      done: issueItems.length === 0,
    },
    {
      title: 'Confirm Required Fields',
      detail: `${missingFields.length} required field(s) still unfilled.`,
      done: missingFields.length === 0,
    },
    {
      title: 'Finalize And Export',
      detail: 'Once all checks are complete, go to Form Preview and export to extension.',
      done: missingItems.length === 0 && issueItems.length === 0,
    },
  ];

  const readyNow = missingItems.length === 0 && issueItems.length === 0;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Readiness Check (Review & Finalize)</h1>
          <p className="mt-2 text-sm text-slate-600">Final answer to: "Am I ready to submit?"</p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-6">
              <ReadinessGauge score={combinedScore} size={300} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Summary</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{readinessLabel(combinedScore)}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-green-700">Verified</p>
                  <p className="mt-1 text-2xl font-bold text-green-700">{verifiedItems.length}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Issues</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{issueItems.length}</p>
                </div>
                <div className="rounded-xl border border-slate-300 bg-slate-100 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-700">Missing</p>
                  <p className="mt-1 text-2xl font-bold text-slate-700">{missingItems.length}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Checklist completion: {readinessScore.complete}/{readinessScore.total} | Form completion: {formCompletion.percentage}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Verified</h2>
            </div>
            <div className="space-y-2">
              {verifiedItems.length > 0 ? (
                verifiedItems.map((item) => (
                  <div key={item} className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-green-900">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-green-900/80">No verified items yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Issues Detected</h2>
            </div>
            <div className="space-y-2">
              {issueItems.length > 0 ? (
                issueItems.map((item) => (
                  <div key={item} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-amber-900/80">No active issues detected.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-300 bg-slate-100 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <Circle className="h-4 w-4 fill-slate-500 text-slate-500" />
              <h2 className="text-sm font-semibold">Missing</h2>
            </div>
            <div className="space-y-2">
              {missingItems.length > 0 ? (
                missingItems.map((item) => (
                  <div key={item} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-700">No missing items.</p>
              )}
            </div>
          </section>
        </div>
      </section>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next Steps</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Final Checklist</h2>

        <div className="mt-4 space-y-3">
          {nextSteps.map((step) => (
            <div
              key={step.title}
              className={cn(
                'rounded-xl border p-3',
                step.done ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'
              )}
            >
              <div className="flex items-start gap-2">
                <span className={cn('mt-1 h-2.5 w-2.5 rounded-full', step.done ? 'bg-green-600' : 'bg-slate-400')} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-sm text-slate-600">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <Button asChild variant="outline" className="w-full justify-start rounded-xl">
            <Link to="/documents">Review uploaded documents</Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start rounded-xl">
            <Link to="/ocr-review">Review extracted fields</Link>
          </Button>
          <Button asChild className="w-full justify-start rounded-xl bg-slate-900 hover:bg-slate-800">
            <Link to="/form-preview">Finalize in form preview</Link>
          </Button>
        </div>

        <div
          className={cn(
            'mt-5 rounded-xl border p-3 text-sm',
            readyNow
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          )}
        >
          {readyNow
            ? 'You are ready to submit. Do one final review and export to extension.'
            : 'Not ready yet. Complete all missing and issue items first.'}
        </div>
      </aside>
    </div>
  );
}
