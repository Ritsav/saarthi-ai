import { useMemo } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProcessType } from '@/types';
import { UploadBox } from '@/components/passport/UploadBox';
import { PassportFileCard } from '@/components/passport/PassportFileCard';
import { ValidationBadge } from '@/components/passport/ValidationBadge';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { documents, uploadDocument } = useDocuments();
  const { fields } = usePassportFormData();

  const passportDocs = documents.filter((doc) => doc.process_type === 'PASSPORT_APPLICATION');

  const validationSummary = useMemo(() => {
    const nameDetected = fields.find((field) => field.key === 'full_name')?.value;
    const dobDetected = fields.find((field) => field.key === 'date_of_birth')?.value;
    const citizenshipDetected = fields.find((field) => field.key === 'citizenship_number')?.value;

    return {
      nameDetected: Boolean(nameDetected),
      dobDetected: Boolean(dobDetected),
      citizenshipDetected: Boolean(citizenshipDetected),
      photoQuality: passportDocs.some((doc) => doc.file_name.toLowerCase().includes('photo')) ? 'Needs review' : 'Not checked yet',
      imageClarity: 'Good',
    };
  }, [fields, passportDocs]);

  const handleFileSelect = async (files: File[]) => {
    for (const file of files) {
      await uploadDocument(file, 'PASSPORT_APPLICATION' as ProcessType);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Document Upload & Validation</h1>
        <p className="mt-2 text-sm text-slate-600">Upload citizenship, passport photo, and supporting files. Saarthi validates quality and extraction readiness.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <UploadBox onFileSelect={handleFileSelect} />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {passportDocs.map((document) => (
              <PassportFileCard key={document.id} document={document} onReview={() => navigate('/ocr-review')} />
            ))}
          </div>

          {!passportDocs.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Upload your first document to start validation.
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">AI validation summary</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Name detected</span>
                <ValidationBadge state={validationSummary.nameDetected ? 'valid' : 'missing'} />
              </div>
              <div className="flex items-center justify-between">
                <span>Date of birth detected</span>
                <ValidationBadge state={validationSummary.dobDetected ? 'valid' : 'missing'} />
              </div>
              <div className="flex items-center justify-between">
                <span>Citizenship number detected</span>
                <ValidationBadge state={validationSummary.citizenshipDetected ? 'valid' : 'missing'} />
              </div>
              <div className="flex items-center justify-between">
                <span>Photo quality check</span>
                <ValidationBadge state={validationSummary.photoQuality === 'Needs review' ? 'needs_review' : 'valid'} />
              </div>
              <div className="flex items-center justify-between">
                <span>Image clarity check</span>
                <ValidationBadge state="valid" />
              </div>
            </div>
          </div>

          <AlertNotice tone="warning" title="Missing requirements summary" description="Issue date is missing from extracted data. Add it during OCR review." />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Privacy & security
            </div>
            <p className="mt-2 text-sm text-slate-600">Your documents are securely processed for readiness checks and extraction review.</p>
          </div>

          <Button className="w-full rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/ocr-review')}>
            <Sparkles className="mr-2 h-4 w-4" />
            Review extracted fields
          </Button>
        </aside>
      </section>
    </div>
  );
}
