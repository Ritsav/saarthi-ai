import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Eye,
  FileImage,
  FileText,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ProcessType } from '@/types';
import { UploadBox } from '@/components/passport/UploadBox';
import { ValidationBadge } from '@/components/passport/ValidationBadge';
import { AlertNotice } from '@/components/passport/AlertNotice';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/hooks/useDocuments';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { cn } from '@/lib/utils';

type RequiredDocumentType = 'CITIZENSHIP' | 'PASSPORT_PHOTO';

const REQUIRED_DOCS: Array<{
  type: RequiredDocumentType;
  title: string;
  detail: string;
}> = [
  {
    type: 'CITIZENSHIP',
    title: 'Citizenship Document',
    detail: 'Used to extract name, citizenship number, DOB, and issue district.',
  },
  {
    type: 'PASSPORT_PHOTO',
    title: 'Passport Photo',
    detail: 'Used to validate face visibility, background, and image quality.',
  },
];

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeAxiosError = error as {
      response?: {
        data?: {
          message?: unknown;
        };
      };
      message?: unknown;
    };

    if (typeof maybeAxiosError.response?.data?.message === 'string') {
      return maybeAxiosError.response.data.message;
    }

    if (typeof maybeAxiosError.message === 'string') {
      return maybeAxiosError.message;
    }
  }

  return 'Upload failed. Please try with a clearer and compliant file.';
}

async function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

async function validateSelectedFile(file: File, documentType: RequiredDocumentType): Promise<string | null> {
  const extension = file.name.toLowerCase().split('.').pop() || '';

  if (documentType === 'PASSPORT_PHOTO') {
    const allowed = new Set(['jpg', 'jpeg', 'png']);
    if (!allowed.has(extension)) {
      return 'Passport photo must be JPG or PNG.';
    }

    if (file.size < 25 * 1024) {
      return 'Passport photo is too small. Upload a clearer high-resolution image.';
    }

    const dimensions = await readImageDimensions(file);
    if (!dimensions) {
      return 'Could not read passport photo dimensions. Please re-upload as JPG/PNG.';
    }

    if (dimensions.width < 300 || dimensions.height < 380) {
      return 'Passport photo resolution is too low. Use at least 300x380 pixels.';
    }

    if (dimensions.width >= dimensions.height) {
      return 'Passport photo must be portrait orientation.';
    }

    const ratio = dimensions.width / dimensions.height;
    if (ratio < 0.68 || ratio > 0.82) {
      return 'Passport photo aspect ratio should be close to 35:45.';
    }

    return null;
  }

  const allowed = new Set(['jpg', 'jpeg', 'png', 'pdf']);
  if (!allowed.has(extension)) {
    return 'Citizenship document must be JPG, PNG, or PDF.';
  }

  if (file.size < 40 * 1024) {
    return 'Citizenship file is too small to verify. Upload a clearer full document.';
  }

  if (file.type.startsWith('image/')) {
    const dimensions = await readImageDimensions(file);
    if (dimensions && (dimensions.width < 600 || dimensions.height < 400)) {
      return 'Citizenship image resolution is too low. Upload a clearer full scan/photo.';
    }
  }

  return null;
}

function hasCriticalValidationIssue(document: {
  status: string;
  validation_result?: {
    is_valid?: boolean;
    fields_invalid?: string[];
    compliance_failures?: string[];
  };
}): boolean {
  if (document.status !== 'analyzed') {
    return document.status === 'error';
  }

  const validation = document.validation_result;
  return (
    validation?.is_valid === false ||
    toArray(validation?.fields_invalid).length > 0 ||
    toArray(validation?.compliance_failures).length > 0
  );
}

function mapDocumentState(
  document: {
    status: string;
    validation_result?: {
      is_valid?: boolean;
      fields_invalid?: string[];
      compliance_failures?: string[];
    };
  }
): 'valid' | 'needs_review' | 'missing' | 'expired' | 'low_quality' | 'wrong_format' {
  if (document.status === 'analyzed') return hasCriticalValidationIssue(document) ? 'needs_review' : 'valid';
  if (document.status === 'error') return 'needs_review';
  if (document.status === 'analyzing') return 'low_quality';
  return 'missing';
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { documents, uploadDocument, analyzeDocument, deleteDocument } = useDocuments();
  const { fields, refresh: refreshFormData } = usePassportFormData();
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{
    tone: 'info' | 'success' | 'warning';
    title: string;
    description: string;
  } | null>(null);

  const passportDocs = documents.filter(
    (doc) =>
      doc.process_type === 'PASSPORT_APPLICATION' &&
      (doc.document_type === 'CITIZENSHIP' || doc.document_type === 'PASSPORT_PHOTO')
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const validationSummary = useMemo(() => {
    const requiredFields = fields.filter((field) => field.required);
    const trackedFields = (requiredFields.length > 0 ? requiredFields : fields).slice(0, 5);
    const completed = trackedFields.filter((field) => field.value.trim().length > 0).length;

    return {
      trackedFields,
      completed,
      total: trackedFields.length,
      photoUploaded: passportDocs.some((doc) => doc.document_type === 'PASSPORT_PHOTO' || doc.file_name.toLowerCase().includes('photo')),
    };
  }, [fields, passportDocs]);

  const requiredDocStatus = useMemo(() => {
    return REQUIRED_DOCS.map((required) => {
      const latest = passportDocs.find((doc) => doc.document_type === required.type);
      const state = !latest
        ? 'missing'
        : latest.status === 'error'
          ? 'issue'
          : latest.status === 'analyzed' && !hasCriticalValidationIssue(latest)
            ? 'verified'
            : latest.status === 'analyzing'
              ? 'analyzing'
              : 'issue';

      return {
        ...required,
        latest,
        state,
      };
    });
  }, [passportDocs]);

  const requiredIssueCount = requiredDocStatus.filter((entry) => entry.state === 'issue').length;

  const handleFileSelect = async (
    files: File[],
    documentType: 'CITIZENSHIP' | 'PASSPORT_PHOTO'
  ) => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      let uploadedCount = 0;
      const failures: string[] = [];

      for (const file of files) {
        const localValidationError = await validateSelectedFile(file, documentType);
        if (localValidationError) {
          failures.push(`${file.name}: ${localValidationError}`);
          continue;
        }

        try {
          const uploaded = await uploadDocument(
            file,
            'PASSPORT_APPLICATION' as ProcessType,
            documentType
          );
          await analyzeDocument(uploaded.id);
          uploadedCount += 1;
        } catch (error) {
          failures.push(`${file.name}: ${getErrorMessage(error)}`);
        }
      }
      await refreshFormData();

      if (failures.length > 0 && uploadedCount > 0) {
        setUploadFeedback({
          tone: 'warning',
          title: 'Some files were rejected',
          description: failures.slice(0, 3).join(' | '),
        });
        return;
      }

      if (failures.length > 0) {
        setUploadFeedback({
          tone: 'warning',
          title: 'Upload rejected',
          description: failures.slice(0, 3).join(' | '),
        });
        return;
      }

      setUploadFeedback({
        tone: 'success',
        title: 'Upload and validation complete',
        description: `${uploadedCount} file(s) uploaded and sent for OCR/compliance checks.`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">My Documents (Task Execution)</h1>
        <p className="mt-2 text-sm text-slate-600">Upload, analyze, and review feedback. This is where document processing happens.</p>
      </section>

      <section className="space-y-5">
        <UploadBox onFileSelect={handleFileSelect} />

        {isUploading ? (
          <AlertNotice
            tone="info"
            title="System is analyzing uploaded files"
            description="OCR and validation are running. Cards will update with extracted feedback."
          />
        ) : null}

        {uploadFeedback ? (
          <AlertNotice
            tone={uploadFeedback.tone}
            title={uploadFeedback.title}
            description={uploadFeedback.description}
          />
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Required Documents</h2>
            <span className="text-xs text-slate-500">Grid View</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {requiredDocStatus.map((entry) => (
              <div key={entry.type} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{entry.detail}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium',
                      entry.state === 'verified'
                        ? 'bg-green-100 text-green-700'
                        : entry.state === 'issue'
                          ? 'bg-amber-100 text-amber-700'
                          : entry.state === 'analyzing'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-200 text-slate-700'
                    )}
                  >
                    {entry.state === 'verified'
                      ? 'Verified'
                      : entry.state === 'issue'
                        ? 'Issue'
                        : entry.state === 'analyzing'
                          ? 'Analyzing'
                          : 'Missing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Uploaded Documents</h2>
            <span className="text-xs text-slate-500">Vertical Stack</span>
          </div>

          {passportDocs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Upload your first document to start the analysis workflow.
            </div>
          ) : (
            <div className="space-y-3">
              {passportDocs.map((document) => {
                const issueMessages = new Set<string>();
                if (document.status === 'error' && document.processing_error) {
                  issueMessages.add(document.processing_error);
                }
                if (Array.isArray(document.validation_result?.compliance_failures)) {
                  for (const failure of document.validation_result.compliance_failures) {
                    issueMessages.add(failure);
                  }
                }
                if (Array.isArray(document.validation_result?.warnings)) {
                  for (const warning of document.validation_result.warnings) {
                    issueMessages.add(warning);
                  }
                }
                if (Array.isArray(document.validation_result?.fields_missing) && document.validation_result.fields_missing.length > 0) {
                  issueMessages.add(`Missing checks: ${document.validation_result.fields_missing.join(', ')}`);
                }
                if (Array.isArray(document.validation_result?.fields_invalid) && document.validation_result.fields_invalid.length > 0) {
                  issueMessages.add(`Invalid checks: ${document.validation_result.fields_invalid.join(', ')}`);
                }
                if (Array.isArray(document.validation_result?.suggestions)) {
                  for (const suggestion of document.validation_result.suggestions) {
                    issueMessages.add(`Suggestion: ${suggestion}`);
                  }
                }

                const extractedName = document.ocr_preview?.name || 'Not extracted';
                const extractedDob = document.ocr_preview?.date_of_birth || 'Not extracted';
                const extractedNumber = document.ocr_preview?.citizenship_number || 'Not extracted';

                return (
                  <div key={document.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                        {document.document_type === 'PASSPORT_PHOTO' ? (
                          <FileImage className="h-5 w-5 text-slate-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-600" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="truncate text-sm font-semibold text-slate-900">{document.file_name}</p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <CalendarClock className="h-3.5 w-3.5" />
                              Uploaded {formatTimestamp(document.created_at)}
                            </p>
                          </div>
                          <ValidationBadge state={mapDocumentState(document)} />
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Name</p>
                            <p className="mt-1 text-sm text-slate-800">{extractedName}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">DOB</p>
                            <p className="mt-1 text-sm text-slate-800">{extractedDob}</p>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">Citizenship No.</p>
                            <p className="mt-1 text-sm text-slate-800">{extractedNumber}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {document.preview_url || document.thumbnail_url ? (
                            <Button asChild variant="outline" size="sm" className="rounded-xl">
                              <a href={document.preview_url || document.thumbnail_url} target="_blank" rel="noreferrer">
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                Preview
                              </a>
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/ocr-review')}>
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Preview
                            </Button>
                          )}

                          <input
                            id={`replace-doc-${document.id}`}
                            type="file"
                            className="hidden"
                            accept={document.document_type === 'PASSPORT_PHOTO' ? '.jpg,.jpeg,.png' : '.jpg,.jpeg,.png,.pdf'}
                            onChange={async (event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;

                              const replacementType =
                                (document.document_type as RequiredDocumentType) || 'CITIZENSHIP';
                              const localValidationError = await validateSelectedFile(file, replacementType);
                              if (localValidationError) {
                                setUploadFeedback({
                                  tone: 'warning',
                                  title: 'Replacement rejected',
                                  description: `${file.name}: ${localValidationError}`,
                                });
                                event.target.value = '';
                                return;
                              }

                              setActiveDocumentId(document.id);
                              try {
                                const uploaded = await uploadDocument(
                                  file,
                                  'PASSPORT_APPLICATION' as ProcessType,
                                  replacementType
                                );
                                await analyzeDocument(uploaded.id);
                                await deleteDocument(document.id);
                                await refreshFormData();
                                setUploadFeedback({
                                  tone: 'success',
                                  title: 'Document replaced',
                                  description: `${file.name} passed upload checks and was re-analyzed.`,
                                });
                              } catch (error) {
                                setUploadFeedback({
                                  tone: 'warning',
                                  title: 'Replacement failed',
                                  description: `${file.name}: ${getErrorMessage(error)}`,
                                });
                              } finally {
                                setActiveDocumentId(null);
                                event.target.value = '';
                              }
                            }}
                          />
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              disabled={activeDocumentId === document.id}
                              onClick={() => window.document.getElementById(`replace-doc-${document.id}`)?.click()}
                            >
                              <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                              Replace
                            </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                            disabled={activeDocumentId === document.id}
                            onClick={async () => {
                              setActiveDocumentId(document.id);
                              try {
                                await deleteDocument(document.id);
                                await refreshFormData();
                              } finally {
                                setActiveDocumentId(null);
                              }
                            }}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>

                        {issueMessages.size > 0 ? (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                              Issue Details
                            </p>
                            <ul className="space-y-1 text-sm text-amber-900">
                              {[...issueMessages].map((message, index) => (
                                <li key={`${document.id}-issue-${index}`} className="flex gap-2">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                  <span>{message}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <AlertNotice
          tone={
            requiredIssueCount > 0 || validationSummary.completed !== validationSummary.total
              ? 'warning'
              : 'success'
          }
          title="System feedback"
          description={
            requiredIssueCount > 0
              ? `${requiredIssueCount} required document(s) failed compliance checks. Replace them before submission.`
              : validationSummary.completed === validationSummary.total
                ? 'Required mapped fields are currently populated and required docs are valid.'
                : `${validationSummary.total - validationSummary.completed} mapped required fields still need values.`
          }
        />
        <Button className="rounded-xl bg-slate-900 hover:bg-slate-800" onClick={() => navigate('/ocr-review')}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Review extracted fields
        </Button>
      </section>
    </div>
  );
}
