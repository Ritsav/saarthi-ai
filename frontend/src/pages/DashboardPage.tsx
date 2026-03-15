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

export default function DashboardPage() {
  const { documents } = useDocuments();
  const { readinessScore, requirements } = useProcess('PASSPORT_APPLICATION');
  const { missingFields } = usePassportFormData();

  const passportDocs = documents.filter((doc) => doc.process_type === 'PASSPORT_APPLICATION');
  const missingDocs = requirements.filter((item) => item.status !== 'completed').length;
  const issuesFound = missingFields.length + documents.filter((doc) => doc.status === 'error').length;
  const readyToProceed = readinessScore.score >= 85 && issuesFound <= 1;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Passport Preparation Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">A clear overview of your Nepal passport readiness before official submission.</p>
        <div className="mt-4">
          <CommandInput />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/assistant">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Check requirements
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/documents">
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload citizenship
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto justify-start rounded-2xl border-slate-200 py-4">
          <Link to="/documents">
            <FileText className="mr-2 h-4 w-4" />
            Upload photo
          </Link>
        </Button>
        <Button asChild className="h-auto justify-start rounded-2xl bg-slate-900 py-4 hover:bg-slate-800">
          <Link to="/readiness">
            Review readiness
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
              <p>Current status: {readyToProceed ? 'Ready to proceed' : 'Almost ready'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <StatusCard label="Documents uploaded" value={passportDocs.length} description="Passport-related files" icon={<FileText className="h-4 w-4 text-slate-400" />} />
          <StatusCard label="Missing items" value={missingDocs} description="Required docs still pending" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />} />
          <StatusCard label="Issues found" value={issuesFound} description="Fields or validations to review" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} />
          <StatusCard label="Ready to proceed" value={readyToProceed ? 'Yes' : 'No'} description="Based on current readiness" icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AlertNotice
          tone={readyToProceed ? 'success' : 'warning'}
          title={readyToProceed ? 'You are almost ready to proceed' : 'We found a few things to fix before you continue'}
          description={readyToProceed ? 'Review final form preview and proceed to official portal.' : 'Complete missing fields and replace unclear files for smoother approval.'}
        />
        <AlertNotice
          tone="info"
          title="Next recommended action"
          description={missingDocs > 0 ? 'Upload missing passport documents from My Documents.' : 'Review OCR extracted fields and confirm details.'}
        />
      </section>
    </div>
  );
}
