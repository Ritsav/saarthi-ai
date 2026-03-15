import { useMemo } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OCRFieldReview } from '@/components/passport/OCRFieldReview';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';

export default function OCRReviewPage() {
  const navigate = useNavigate();
  const { documents } = useDocuments();
  const { fields, setFieldValue, setFieldStatus, approveAll } = usePassportFormData();

  const previewDoc = documents.find((doc) => doc.process_type === 'PASSPORT_APPLICATION');

  const summary = useMemo(() => {
    const confirmed = fields.filter((field) => field.status === 'confirmed').length;
    const needsReview = fields.filter((field) => field.status === 'needs_review' || field.status === 'low_confidence').length;
    const missing = fields.filter((field) => !field.value.trim()).length;

    return { confirmed, needsReview, missing };
  }, [fields]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">OCR Extraction Review</h1>
        <p className="mt-2 text-sm text-slate-600">Review extracted fields side-by-side, edit inaccuracies, and approve only correct values.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Document preview</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {previewDoc?.preview_url || previewDoc?.thumbnail_url ? (
              <img src={previewDoc.preview_url || previewDoc.thumbnail_url} alt={previewDoc.file_name} className="h-[420px] w-full object-cover" />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">
                <FileText className="mr-2 h-4 w-4" />
                No image preview available
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <AlertNotice tone="success" title="Confirmed" description={`${summary.confirmed} fields`} />
            <AlertNotice tone="warning" title="Needs review" description={`${summary.needsReview} fields`} />
            <AlertNotice tone="info" title="Missing" description={`${summary.missing} fields`} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              {fields.map((field) => (
                <OCRFieldReview
                  key={field.key}
                  field={field}
                  onChange={(value) => setFieldValue(field.key, value)}
                  onConfirm={() => setFieldStatus(field.key, field.value ? 'confirmed' : 'missing')}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-xl bg-slate-900 hover:bg-slate-800"
              onClick={() => {
                approveAll();
                navigate('/form-preview');
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve extracted data
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/documents')}>
              Review uploaded documents
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
