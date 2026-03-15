import { AlertTriangle, ArrowRight, CheckCircle2, FileText, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommandInput } from '@/components/passport/CommandInput';
import { ReadinessGauge } from '@/components/passport/ReadinessGauge';
import { StatusCard } from '@/components/passport/StatusCard';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { useProcess } from '@/hooks/useProcess';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { cn } from '@/lib/utils';

function requirementChipClass(status: 'completed' | 'missing' | 'invalid') {
  if (status === 'completed') {
    return 'bg-green-50 text-green-700 border-green-200';
  }

  if (status === 'invalid') {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function requirementStatusLabel(status: 'completed' | 'missing' | 'invalid') {
  if (status === 'completed') {
    return 'Completed';
  }

  if (status === 'invalid') {
    return 'Invalid';
  }

  return 'Missing';
}

export default function DashboardPage() {
  const { documents } = useDocuments();
  const { readinessScore, requirements, processInfo, isLoading } = useProcess('PASSPORT_APPLICATION');
  const { missingFields, formCompletion } = usePassportFormData();

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  );
  const missingRequirements = requirements.filter((item) => item.status === 'missing');
  const invalidRequirements = requirements.filter((item) => item.status === 'invalid');
  const documentErrors = passportDocs.filter((doc) => doc.status === 'error').length;
  const issuesFound = missingFields.length + invalidRequirements.length + documentErrors;
  const readyToProceed = requirements.length > 0 && missingRequirements.length === 0 && issuesFound === 0;

  const processName = processInfo?.name || 'Passport Application';
  const processDescription =
    processInfo?.description || 'Track checklist, OCR extraction, and form readiness from backend data.';
  const nextRequirement = missingRequirements[0] || invalidRequirements[0] || null;
  const statusSummary = isLoading
    ? 'Loading process status from backend...'
    : readyToProceed
      ? 'Ready to proceed'
      : nextRequirement
        ? `Next item: ${nextRequirement.requirement}`
        : 'Continue reviewing extracted fields';

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Process overview</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">{processName}</h1>
        <p className="mt-2 text-sm text-slate-600">{processDescription}</p>
        <p className="mt-2 text-sm text-slate-700">Current status: {statusSummary}</p>
        <div className="mt-4">
          <CommandInput />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/assistant">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Requirements ({readinessScore.complete}/{readinessScore.total})
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/documents">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload documents ({passportDocs.length})
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/ocr-review">
            <FileText className="mr-2 h-4 w-4" />
            OCR review ({missingFields.length} pending)
          </Link>
        </Button>
        <Button asChild className="h-auto justify-start rounded-2xl bg-slate-900 py-4 hover:bg-slate-800">
          <Link to="/readiness">
            Readiness ({readinessScore.score}%)
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Preparation progress</h2>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
            <ReadinessGauge score={readinessScore.score} />
            <div className="space-y-3 text-sm text-slate-600">
              <p>Documents uploaded: {passportDocs.length}</p>
              <p>Checklist complete: {readinessScore.complete}/{readinessScore.total}</p>
              <p>Form completion: {formCompletion.completed}/{formCompletion.total}</p>
              <p>Current status: {readyToProceed ? 'Ready to proceed' : 'Action required'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <StatusCard
            label="Documents uploaded"
            value={passportDocs.length}
            description={`${passportDocs.filter((doc) => doc.status === 'analyzed').length} analyzed`}
            icon={<FileText className="h-4 w-4 text-slate-400" />}
          />
          <StatusCard
            label="Missing items"
            value={missingRequirements.length}
            description={nextRequirement?.requirement || 'No missing checklist items'}
            icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          />
          <StatusCard label="Issues found" value={issuesFound} description="Fields or validations to review" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
          <StatusCard label="Ready to proceed" value={readyToProceed ? 'Yes' : 'No'} description="Based on current readiness" icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Checklist from backend</h2>
        <div className="mt-3 grid gap-2">
          {requirements.map((item) => (
            <div key={item.requirement} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <div className="text-sm text-slate-700">
                <p className="font-medium">{item.requirement}</p>
                <p className="text-xs text-slate-500">{item.notes || 'No notes'}</p>
              </div>
              <span className={cn('rounded-full border px-3 py-1 text-xs font-semibold', requirementChipClass(item.status))}>
                {requirementStatusLabel(item.status)} ({item.readiness_score}%)
              </span>
            </div>
          ))}
          {requirements.length === 0 ? (
            <p className="text-sm text-slate-500">No checklist data available yet.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <StatusCard
          label="Authority"
          value={processInfo?.authority || 'Not available'}
          description="Issued by backend process catalog"
        />
        <StatusCard
          label="Estimated time"
          value={processInfo?.estimated_time || 'Not available'}
          description="Current backend value"
        />
        <StatusCard
          label="Government fee"
          value={processInfo?.government_fee || 'Not available'}
          description="Current backend value"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AlertNotice
          tone={readyToProceed ? 'success' : 'warning'}
          title={readyToProceed ? 'All checklist items are satisfied' : 'Checklist still needs updates'}
          description={readyToProceed ? 'Proceed to final form review before submission.' : `${missingRequirements.length} missing items, ${invalidRequirements.length} invalid items, ${missingFields.length} missing form fields.`}
        />
        <AlertNotice
          tone="info"
          title="Next recommended action"
          description={
            nextRequirement
              ? `Resolve "${nextRequirement.requirement}" first.`
              : 'Review OCR extracted fields and confirm details.'
          }
        />
      </section>
    </div>
  );
}
