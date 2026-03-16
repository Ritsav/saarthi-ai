import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Edit3 } from 'lucide-react';
import { usePassportFormData } from '@/hooks/usePassportFormData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertNotice } from '@/components/passport/AlertNotice';
import api from '@/config/api';
import { useState } from 'react';

export default function FormPreviewPage() {
  const {
    values,
    sections,
    fieldLabels,
    fieldMeta,
    setFieldValue,
    formCompletion,
    missingFields,
    isLoading,
  } = usePassportFormData();
  const [exportState, setExportState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: '',
  });

  const hasWarnings = missingFields.length > 0;
  const renderedSections = useMemo(() => sections, [sections]);

  const exportToExtension = async () => {
    setExportState({
      status: 'loading',
      message: 'Exporting mapped fields to extension...',
    });

    try {
      const response = await api.post('/api/extension/export', {
        process_type: 'PASSPORT_APPLICATION',
        values,
      });

      const exportedCount = response.data?.data?.exportedCount ?? 0;
      setExportState({
        status: 'success',
        message: `Export complete. ${exportedCount} fields saved for extension autofill.`,
      });
    } catch (error: any) {
      setExportState({
        status: 'error',
        message:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to export fields to extension.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Passport Application Form Preview</h1>
        <p className="mt-2 text-sm text-slate-600">Review mapped OCR values, fill missing data, and verify formatting before official submission.</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading form fields from backend...</p>
          ) : null}

          {renderedSections.map((section) => (
            <div key={section.title} className="mb-6 rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                <span className="text-xs text-slate-500">
                  {section.completed}/{section.total} complete
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {section.fields.map((fieldKey) => (
                  <label key={fieldKey} className="space-y-1 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      {fieldLabels[fieldKey] || fieldKey}
                      {fieldMeta[fieldKey]?.approvalRequired ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          approve
                        </span>
                      ) : null}
                    </span>

                    {fieldMeta[fieldKey]?.fieldType === 'radio' &&
                    Array.isArray(fieldMeta[fieldKey]?.options) &&
                    fieldMeta[fieldKey].options.length > 0 ? (
                      <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {fieldMeta[fieldKey].options.map((option) => (
                          <label
                            key={`${fieldKey}:${option.value}`}
                            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                          >
                            <input
                              type="radio"
                              name={`preview-${fieldKey}`}
                              value={option.value}
                              checked={(values[fieldKey] || '') === option.value}
                              onChange={(event) => setFieldValue(fieldKey, event.target.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    ) : fieldMeta[fieldKey]?.fieldType === 'select' ? (
                      <select
                        value={values[fieldKey] || ''}
                        onChange={(event) => setFieldValue(fieldKey, event.target.value)}
                        className={`h-10 w-full rounded-xl border px-3 text-sm ${
                          values[fieldKey] ? 'border-slate-300 bg-white' : 'border-amber-300 bg-amber-50'
                        }`}
                      >
                        <option value="">Select an option</option>
                        {(fieldMeta[fieldKey]?.options || []).map((option) => (
                          <option key={`${fieldKey}:${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={fieldMeta[fieldKey]?.fieldType === 'date' ? 'date' : 'text'}
                        value={values[fieldKey] || ''}
                        onChange={(event) => setFieldValue(fieldKey, event.target.value)}
                        className={`rounded-xl ${
                          values[fieldKey] ? 'border-slate-300' : 'border-amber-300 bg-amber-50'
                        }`}
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Completion status</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formCompletion.percentage}%</p>
            <p className="text-sm text-slate-600">{formCompletion.completed} of {formCompletion.total} required fields complete.</p>
          </div>

          {hasWarnings ? (
            <AlertNotice
              tone="warning"
              title="Missing information alerts"
              description={`Missing: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? '...' : ''}`}
            />
          ) : (
            <AlertNotice tone="success" title="All required sections look complete" description="Proceed to readiness check for final confirmation." />
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
            <div className="mt-3 space-y-2">
              <Button asChild variant="outline" className="w-full rounded-xl justify-start">
                <Link to="/ocr-review">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit extracted data
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl justify-start">
                <Link to="/documents">Review uploaded documents</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl justify-start"
                onClick={exportToExtension}
                disabled={exportState.status === 'loading'}
              >
                Export to extension
              </Button>
              <Button asChild className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 justify-start">
                <Link to="/readiness">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Check readiness
                </Link>
              </Button>
            </div>
          </div>

          {exportState.status !== 'idle' ? (
            <AlertNotice
              tone={exportState.status === 'error' ? 'warning' : exportState.status === 'success' ? 'success' : 'info'}
              title={exportState.status === 'success' ? 'Extension export ready' : exportState.status === 'error' ? 'Extension export failed' : 'Export in progress'}
              description={exportState.message}
            />
          ) : null}
        </aside>
      </section>
    </div>
  );
}
