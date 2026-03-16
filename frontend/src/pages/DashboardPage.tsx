import { AlertTriangle, ArrowRight, CheckCircle2, FileText, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CommandInput } from '@/components/passport/CommandInput';
import { StatusCard } from '@/components/passport/StatusCard';
import { useDocuments } from '@/hooks/useDocuments';
import { useProcess } from '@/hooks/useProcess';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { documents } = useDocuments();
  const { readinessScore, requirements, processInfo } = useProcess('PASSPORT_APPLICATION');
  const { missingFields } = usePassportFormData();

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  );
  
  const invalidRequirements = requirements.filter((item) => item.status === 'invalid');
  const documentErrors = passportDocs.filter((doc) => doc.status === 'error').length;
  
  // Metrics computation
  const issuesFound = missingFields.length + invalidRequirements.length + documentErrors;
  const readyToProceed = requirements.length > 0 && issuesFound === 0 && readinessScore.score === 100;
  const processName = processInfo?.name || 'Passport Application';

  return (
    <div className="relative h-[calc(100vh-112px)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-full md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-5 md:block">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Navigation</p>
          <nav className="mt-4 space-y-2 text-sm">
            <a href="#" className="block rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-800 shadow-sm">
              Overview
            </a>
            <a href="#" className="block rounded-xl px-3 py-2 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
              Uploaded Files
            </a>
            <a href="#" className="block rounded-xl px-3 py-2 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
              OCR Results
            </a>
            <a href="#" className="block rounded-xl px-3 py-2 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
              Form Mapping
            </a>
            <a href="#" className="block rounded-xl px-3 py-2 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors">
              Extension Export
            </a>
          </nav>
        </aside>

        <section className="h-full overflow-y-auto bg-slate-50/30 p-6 md:p-10">
          <div className="mx-auto max-w-5xl space-y-10">
            {/* Header */}
            <header className="flex flex-col items-center text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Welcome back, Ram</h1>
              <p className="mt-3 text-slate-500 max-w-lg">
                Your command center for {processName}. Ask the AI to help or jump right into your pending tasks.
              </p>
            </header>

            {/* Search/Action Bar */}
            <div className="mx-auto w-full max-w-2xl px-4">
              <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <CommandInput />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Link to="/assistant" className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-900">Requirements</span>
                <span className="mt-1 text-xs text-slate-500">{readinessScore.complete}/{readinessScore.total} completed</span>
              </Link>

              <Link to="/documents" className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
                <div className="mb-4 rounded-full bg-indigo-50 p-4 text-indigo-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-700">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-900">Upload Docs</span>
                <span className="mt-1 text-xs text-slate-500">{passportDocs.length} files saved</span>
              </Link>

              <Link to="/ocr-review" className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                <div className="mb-4 rounded-full bg-amber-50 p-4 text-amber-600 transition-colors group-hover:bg-amber-100 group-hover:text-amber-700">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-900">OCR Review</span>
                <span className="mt-1 text-xs text-slate-500">{missingFields.length} pending review</span>
              </Link>

              <Link to="/readiness" className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
                <div className="mb-4 rounded-full bg-emerald-50 p-4 text-emerald-600 transition-colors group-hover:bg-emerald-100 group-hover:text-emerald-700">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-900">Readiness</span>
                <span className="mt-1 text-xs text-slate-500">{readinessScore.score}% complete</span>
              </Link>
            </div>

            {/* Split View */}
            <div className="grid gap-8 pb-12 lg:grid-cols-[1.5fr_1fr]">
              {/* Left Column (Progress) */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="mb-8 text-xl font-bold text-slate-900">Application Progress</h2>
                
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8 before:absolute before:inset-0 before:-left-[1px]">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white ring-4 ring-white">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Process Started</h3>
                      <p className="mt-1 text-sm text-slate-500">{processName} initialized successfully.</p>
                    </div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="relative">
                    <div className={cn("absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white", passportDocs.length > 0 ? "bg-green-500 text-white" : "bg-slate-200")}>
                      {passportDocs.length > 0 && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Document Upload</h3>
                      <p className="mt-1 text-sm text-slate-500">{passportDocs.length > 0 ? `${passportDocs.length} documents securely uploaded.` : 'Pending document uploads.'}</p>
                    </div>
                  </div>
                  
                  {/* Step 3 */}
                  <div className="relative">
                    <div className={cn("absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white", missingFields.length === 0 && passportDocs.length > 0 ? "bg-green-500 text-white" : issuesFound > 0 ? "bg-amber-400 text-white" : "bg-slate-200")}>
                      {missingFields.length === 0 && passportDocs.length > 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Data Extraction & Review</h3>
                      <p className="mt-1 text-sm text-slate-500">{missingFields.length > 0 ? `${missingFields.length} fields awaiting OCR review and confirmation.` : 'All extracted details have been reviewed.'}</p>
                    </div>
                  </div>
                  
                  {/* Step 4 */}
                  <div className="relative">
                    <div className={cn("absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white", readyToProceed ? "bg-green-500 text-white" : "bg-slate-200")}>
                      {readyToProceed && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Final Readiness</h3>
                      <p className="mt-1 text-sm text-slate-500">{readyToProceed ? "All set! Ready for final submission." : "Checklist items are still pending completion."}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Metrics) */}
              <div className="space-y-4">
                <h2 className="mb-4 text-xl font-bold text-slate-900">Summary</h2>
                
                <StatusCard
                  label="Documents Uploaded"
                  value={passportDocs.length}
                  description="Total files in secure storage"
                  icon={<FileText className="h-5 w-5 text-slate-500" />}
                  className="bg-white border-slate-200 hover:border-slate-300 transition-colors"
                />

                <StatusCard
                  label="Issues Found"
                  value={issuesFound}
                  description={issuesFound > 0 ? "Missing documents or invalid fields" : "Everything looks perfectly clear"}
                  icon={<AlertTriangle className={cn("h-5 w-5", issuesFound > 0 ? "text-amber-600" : "text-emerald-600")} />}
                  className={cn("border transition-colors", issuesFound > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}
                />

                <StatusCard
                  label="Readiness Score"
                  value={`${readinessScore.score}%`}
                  description="Overall application completion"
                  icon={<CheckCircle2 className={cn("h-5 w-5", readyToProceed ? "text-emerald-600" : "text-blue-600")} />}
                  className={cn("border transition-colors", readyToProceed ? "border-emerald-200 bg-emerald-50" : "border-blue-200 bg-blue-50")}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <button
        type="button"
        className="absolute bottom-6 right-6 h-16 w-16 rounded-full bg-slate-900 text-lg font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.28)] transition-transform duration-200 hover:scale-105"
        aria-label="Open AI Assistant"
      >
        AI
      </button>
    </div>
  );
}
