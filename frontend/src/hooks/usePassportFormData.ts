import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/config/api';
import type { OCRField, ProcessType } from '@/types';

interface PersistedState {
  values: Record<string, string>;
  statuses: Record<string, OCRField['status']>;
}

interface SectionBlueprint {
  id: string;
  title: string;
  fieldKeys: string[];
}

interface FormState {
  fields: OCRField[];
  values: Record<string, string>;
  sectionBlueprints: SectionBlueprint[];
}

interface ProcessFormResponseField {
  key: string;
  label: string;
  required: boolean;
  value: string;
  confidence: number | null;
  field_type?: 'text' | 'date' | 'radio' | 'select';
  options?: Array<{
    value: string;
    label: string;
    selector?: string;
  }>;
  approval_required?: boolean;
  form_step?: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
  section_title?: string;
}

interface ProcessFormResponseSection {
  id: string;
  title: string;
  fields: Array<{ key: string }>;
}

const STORAGE_PREFIX = 'saarthi_form_data';

function storageKey(processType: ProcessType): string {
  return `${STORAGE_PREFIX}:${processType}`;
}

function parsePersisted(processType: ProcessType): PersistedState {
  try {
    const raw = localStorage.getItem(storageKey(processType));
    if (!raw) {
      return { values: {}, statuses: {} };
    }

    const parsed = JSON.parse(raw) as PersistedState;
    return {
      values: parsed.values || {},
      statuses: parsed.statuses || {},
    };
  } catch {
    return { values: {}, statuses: {} };
  }
}

function persistState(processType: ProcessType, state: PersistedState) {
  localStorage.setItem(storageKey(processType), JSON.stringify(state));
}

function humanizeFieldKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function statusFromValue(value: string, confidence: number, persistedStatus?: OCRField['status']): OCRField['status'] {
  if (persistedStatus) {
    return persistedStatus;
  }

  if (!value.trim()) {
    return 'missing';
  }

  if (confidence > 0 && confidence < 0.8) {
    return 'low_confidence';
  }

  return 'needs_review';
}

function buildFallbackState(processType: ProcessType): FormState {
  const persisted = parsePersisted(processType);
  const fieldKeys = Object.keys(persisted.values);
  const fields: OCRField[] = fieldKeys.map((key) => ({
    key,
    label: humanizeFieldKey(key),
    value: persisted.values[key] || '',
    required: false,
    status: persisted.statuses[key] || (persisted.values[key]?.trim() ? 'needs_review' : 'missing'),
    confidence: 0,
  }));

  return {
    fields,
    values: persisted.values,
    sectionBlueprints: [
      {
        id: 'all_fields',
        title: 'Application Fields',
        fieldKeys,
      },
    ],
  };
}

export function usePassportFormData(processType: ProcessType = 'PASSPORT_APPLICATION') {
  const [state, setState] = useState<FormState>(() => buildFallbackState(processType));
  const [isLoading, setIsLoading] = useState(true);
  const [fieldMeta, setFieldMeta] = useState<
    Record<
      string,
      {
        fieldType: 'text' | 'date' | 'radio' | 'select';
        options: Array<{ value: string; label: string; selector?: string }>;
        approvalRequired: boolean;
        formStep: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
        sectionTitle: string;
      }
    >
  >({});

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const persisted = parsePersisted(processType);
      const response = await api.get(`/api/process/${processType}/form`);
      const rawFields = (response.data?.data?.fields || []) as ProcessFormResponseField[];
      const rawSections = (response.data?.data?.sections || []) as ProcessFormResponseSection[];

      const fields: OCRField[] = rawFields.map((rawField) => {
        const backendValue = typeof rawField.value === 'string' ? rawField.value : '';
        const value = backendValue;
        const confidence = typeof rawField.confidence === 'number' ? rawField.confidence : 0;
        const persistedStatus =
          persisted.values[rawField.key] === value ? persisted.statuses[rawField.key] : undefined;
        return {
          key: rawField.key,
          label: rawField.label || humanizeFieldKey(rawField.key),
          value,
          required: Boolean(rawField.required),
          status: statusFromValue(value, confidence, persistedStatus),
          confidence,
        };
      });

      const values = fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {});

      const nextMeta = rawFields.reduce<
        Record<
          string,
          {
            fieldType: 'text' | 'date' | 'radio' | 'select';
            options: Array<{ value: string; label: string; selector?: string }>;
            approvalRequired: boolean;
            formStep: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
            sectionTitle: string;
          }
        >
      >((acc, rawField) => {
        acc[rawField.key] = {
          fieldType: rawField.field_type ?? 'text',
          options: rawField.options ?? [],
          approvalRequired: Boolean(rawField.approval_required),
          formStep: rawField.form_step ?? 'form_3',
          sectionTitle: rawField.section_title ?? 'Application Fields',
        };
        return acc;
      }, {});

      setFieldMeta(nextMeta);

      const sectionBlueprints: SectionBlueprint[] =
        rawSections.length > 0
          ? rawSections.map((section) => ({
              id: section.id,
              title: section.title,
              fieldKeys: section.fields.map((field) => field.key),
            }))
          : [
              {
                id: 'all_fields',
                title: 'Application Fields',
                fieldKeys: fields.map((field) => field.key),
              },
            ];

      const nextState: FormState = {
        fields,
        values,
        sectionBlueprints,
      };

      setState(nextState);
      persistState(processType, {
        values: nextState.values,
        statuses: nextState.fields.reduce<Record<string, OCRField['status']>>((acc, field) => {
          acc[field.key] = field.status;
          return acc;
        }, {}),
      });
    } catch {
      setState(buildFallbackState(processType));
    } finally {
      setIsLoading(false);
    }
  }, [processType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setFieldValue = useCallback(
    (key: string, value: string) => {
      setState((prev) => {
        const nextFields = prev.fields.map((field) => {
          if (field.key !== key) {
            return field;
          }

          const nextStatus: OCRField['status'] = value.trim()
            ? field.status === 'confirmed'
              ? 'confirmed'
              : 'needs_review'
            : 'missing';

          return {
            ...field,
            value,
            status: nextStatus,
          };
        });

        const nextValues = { ...prev.values, [key]: value };
        persistState(processType, {
          values: nextValues,
          statuses: nextFields.reduce<Record<string, OCRField['status']>>((acc, field) => {
            acc[field.key] = field.status;
            return acc;
          }, {}),
        });

        return {
          ...prev,
          fields: nextFields,
          values: nextValues,
        };
      });
    },
    [processType]
  );

  const setFieldStatus = useCallback(
    (key: string, status: OCRField['status']) => {
      setState((prev) => {
        const nextFields = prev.fields.map((field) =>
          field.key === key ? { ...field, status } : field
        );

        persistState(processType, {
          values: prev.values,
          statuses: nextFields.reduce<Record<string, OCRField['status']>>((acc, field) => {
            acc[field.key] = field.status;
            return acc;
          }, {}),
        });

        return {
          ...prev,
          fields: nextFields,
        };
      });
    },
    [processType]
  );

  const approveAll = useCallback(() => {
    setState((prev) => {
      const nextFields = prev.fields.map((field) => ({
        ...field,
        status: field.value.trim() ? ('confirmed' as const) : ('missing' as const),
      }));

      persistState(processType, {
        values: prev.values,
        statuses: nextFields.reduce<Record<string, OCRField['status']>>((acc, field) => {
          acc[field.key] = field.status;
          return acc;
        }, {}),
      });

      return {
        ...prev,
        fields: nextFields,
      };
    });
  }, [processType]);

  const fieldLabels = useMemo(
    () =>
      state.fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.key] = field.label;
        return acc;
      }, {}),
    [state.fields]
  );

  const sections = useMemo(
    () =>
      state.sectionBlueprints.map((section) => {
        const completed = section.fieldKeys.filter((fieldKey) => state.values[fieldKey]?.trim()).length;
        return {
          id: section.id,
          title: section.title,
          fields: section.fieldKeys,
          completed,
          total: section.fieldKeys.length,
        };
      }),
    [state.sectionBlueprints, state.values]
  );

  const formCompletion = useMemo(() => {
    const requiredKeys = state.fields.filter((field) => field.required).map((field) => field.key);
    const referenceKeys = requiredKeys.length > 0 ? requiredKeys : state.fields.map((field) => field.key);
    const completed = referenceKeys.filter((key) => state.values[key]?.trim()).length;
    const total = referenceKeys.length;

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [state.fields, state.values]);

  const missingFields = useMemo(() => {
    const requiredFields = state.fields.filter((field) => field.required);
    const targetFields = requiredFields.length > 0 ? requiredFields : state.fields;

    return targetFields
      .filter((field) => !state.values[field.key]?.trim())
      .map((field) => field.label || field.key);
  }, [state.fields, state.values]);

  return {
    fields: state.fields,
    values: state.values,
    fieldMeta,
    sections,
    fieldLabels,
    isLoading,
    refresh,
    setFieldValue,
    setFieldStatus,
    approveAll,
    missingFields,
    formCompletion,
  };
}
