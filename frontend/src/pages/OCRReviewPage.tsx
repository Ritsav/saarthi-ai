import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OCRFieldReview } from '@/components/passport/OCRFieldReview';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';

const formSteps = [
  {
    key: 'form_1',
    title: 'Form 1',
    subtitle: 'Passport Type',
  },
  {
    key: 'form_2',
    title: 'Form 2',
    subtitle: 'Appointment Booking',
  },
  {
    key: 'form_3',
    title: 'Form 3',
    subtitle: 'Applicant and Address Details',
  },
  {
    key: 'form_4',
    title: 'Form 4',
    subtitle: 'Applicant Category and Uploads',
  },
  {
    key: 'form_5',
    title: 'Form 5',
    subtitle: 'Review and Submit',
  },
] as const;

type FormStepKey = (typeof formSteps)[number]['key'];

export default function OCRReviewPage() {
  const navigate = useNavigate();
  const { documents } = useDocuments();
  const { fields, fieldMeta, setFieldValue, setFieldStatus, approveAll } = usePassportFormData();
  const [currentStep, setCurrentStep] = useState<FormStepKey>('form_1');
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  );
  const previewDoc = passportDocs.find((doc) => doc.preview_url || doc.thumbnail_url) || passportDocs[0];
  const previewUrl = previewDoc?.preview_url || previewDoc?.thumbnail_url;
  const isPdfPreview = previewDoc?.file_type?.toLowerCase() === 'application/pdf';

  const summary = useMemo(() => {
    const confirmed = fields.filter((field) => field.status === 'confirmed').length;
    const needsReview = fields.filter((field) => field.status === 'needs_review' || field.status === 'low_confidence').length;
    const missing = fields.filter((field) => !field.value.trim()).length;

    return { confirmed, needsReview, missing };
  }, [fields]);

  const fieldsByStep = useMemo(() => {
    return formSteps.reduce(
      (acc, step) => {
        acc[step.key] = fields.filter((field) => (fieldMeta[field.key]?.formStep ?? 'form_3') === step.key);
        return acc;
      },
      {
        form_1: [],
        form_2: [],
        form_3: [],
        form_4: [],
        form_5: [],
      } as Record<FormStepKey, typeof fields>
    );
  }, [fieldMeta, fields]);

  const currentStepIndex = formSteps.findIndex((step) => step.key === currentStep);
  const currentStepFields = fieldsByStep[currentStep];

  const sectionsByStep = useMemo(() => {
    return formSteps.reduce(
      (acc, step) => {
        const stepFields = fieldsByStep[step.key];
        const groups = new Map<string, typeof stepFields>();

        for (const field of stepFields) {
          const sectionTitle = fieldMeta[field.key]?.sectionTitle || 'Application Fields';
          const existing = groups.get(sectionTitle) || [];
          existing.push(field);
          groups.set(sectionTitle, existing);
        }

        acc[step.key] = Array.from(groups.entries()).map(([title, groupedFields]) => ({ title, fields: groupedFields }));
        return acc;
      },
      {
        form_1: [],
        form_2: [],
        form_3: [],
        form_4: [],
        form_5: [],
      } as Record<FormStepKey, Array<{ title: string; fields: typeof fields }>>
    );
  }, [fieldMeta, fields, fieldsByStep]);

  const currentStepSections = sectionsByStep[currentStep];
  const safeSectionIndex = Math.min(currentSectionIndex, Math.max(0, currentStepSections.length - 1));
  const activeSection = currentStepSections[safeSectionIndex] ?? null;

  useEffect(() => {
    setCurrentSectionIndex(0);
  }, [currentStep]);

  const approveCurrentSection = () => {
    if (!activeSection) {
      return;
    }

    activeSection.fields.forEach((field) => {
      setFieldStatus(field.key, field.value.trim() ? 'confirmed' : 'missing');
    });
  };

  const goToPrevious = () => {
    if (safeSectionIndex > 0) {
      setCurrentSectionIndex(safeSectionIndex - 1);
      return;
    }

    if (currentStepIndex === 0) {
      return;
    }

    const previousStep = formSteps[currentStepIndex - 1].key;
    const previousStepSectionCount = sectionsByStep[previousStep].length;
    setCurrentStep(previousStep);
    setCurrentSectionIndex(previousStepSectionCount > 0 ? previousStepSectionCount - 1 : 0);
  };

  const goToNext = () => {
    if (safeSectionIndex < currentStepSections.length - 1) {
      setCurrentSectionIndex(safeSectionIndex + 1);
      return;
    }

    if (currentStepIndex === formSteps.length - 1) {
      return;
    }

    const nextStep = formSteps[currentStepIndex + 1].key;
    setCurrentStep(nextStep);
    setCurrentSectionIndex(0);
  };

  const isAtStart = currentStepIndex === 0 && safeSectionIndex === 0;
  const isAtEnd =
    currentStepIndex === formSteps.length - 1 &&
    safeSectionIndex === Math.max(0, currentStepSections.length - 1);

  const totalSections = useMemo(
    () => formSteps.reduce((count, step) => count + sectionsByStep[step.key].length, 0),
    [sectionsByStep]
  );

  const completedSectionsBeforeCurrent = useMemo(() => {
    let completed = 0;

    for (const step of formSteps) {
      if (step.key === currentStep) {
        return completed;
      }
      completed += sectionsByStep[step.key].length;
    }

    return completed;
  }, [currentStep, sectionsByStep]);

  const sectionProgressNumerator =
    totalSections > 0 ? Math.min(totalSections, completedSectionsBeforeCurrent + safeSectionIndex + 1) : 0;
  const progressPercent =
    totalSections > 0 ? Math.round((sectionProgressNumerator / totalSections) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">OCR Extraction Review</h1>
        <p className="mt-2 text-sm text-slate-600">Review OCR data by Form 1-5 sequence (matching `sample-html`), use Previous/Next navigation, and approve fields step-by-step.</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.3fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Document preview</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {previewUrl ? (
              isPdfPreview ? (
                <iframe src={previewUrl} title={previewDoc?.file_name || 'Document preview'} className="h-[360px] w-full" />
              ) : (
                <img src={previewUrl} alt={previewDoc?.file_name || 'Document preview'} className="h-[360px] w-full object-cover" />
              )
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                {sectionProgressNumerator}/{totalSections} sections reviewed
              </p>
            </div>

            <div className="grid gap-3">
              {activeSection ? (
                <section key={`${currentStep}:${activeSection.title}`} className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{activeSection.title}</h3>
                  <div className="grid gap-2">
                    {activeSection.fields.map((field) => (
                      <OCRFieldReview
                        key={field.key}
                        field={field}
                        meta={fieldMeta[field.key]}
                        onChange={(value) => setFieldValue(field.key, value)}
                        onConfirm={() => setFieldStatus(field.key, field.value ? 'confirmed' : 'missing')}
                        compact
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  No mapped OCR fields for this form yet. Continue to the next form, or fill this step manually on the official portal.
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-xs"
                  onClick={goToPrevious}
                  disabled={isAtStart}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-xs"
                  onClick={goToNext}
                  disabled={isAtEnd}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <Button type="button" variant="outline" className="h-9 rounded-lg px-3 text-xs" onClick={approveCurrentSection}>
                Approve current section
              </Button>
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
