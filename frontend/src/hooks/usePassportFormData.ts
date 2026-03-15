import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_OCR_FIELDS, FIELD_LABELS, INITIAL_FORM_VALUES, type FieldStatus, type OCRField } from '../data/passportDemo';

const STORAGE_KEY = 'saarthi_passport_form_data';

interface FormState {
  fields: OCRField[];
  values: Record<string, string>;
}

function loadInitialState(): FormState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        fields: DEFAULT_OCR_FIELDS,
        values: INITIAL_FORM_VALUES,
      };
    }

    const parsed = JSON.parse(raw) as FormState;
    return {
      fields: parsed.fields || DEFAULT_OCR_FIELDS,
      values: parsed.values || INITIAL_FORM_VALUES,
    };
  } catch {
    return {
      fields: DEFAULT_OCR_FIELDS,
      values: INITIAL_FORM_VALUES,
    };
  }
}

function persist(state: FormState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function usePassportFormData() {
  const [state, setState] = useState<FormState>(loadInitialState);

  const setFieldValue = useCallback((key: string, value: string) => {
    setState((prev) => {
      const next: FormState = {
        fields: prev.fields.map((field) => (field.key === key ? { ...field, value } : field)),
        values: { ...prev.values, [key]: value },
      };
      persist(next);
      return next;
    });
  }, []);

  const setFieldStatus = useCallback((key: string, status: FieldStatus) => {
    setState((prev) => {
      const next: FormState = {
        ...prev,
        fields: prev.fields.map((field) => (field.key === key ? { ...field, status } : field)),
      };
      persist(next);
      return next;
    });
  }, []);

  const approveAll = useCallback(() => {
    setState((prev) => {
      const next: FormState = {
        ...prev,
        fields: prev.fields.map((field) => ({ ...field, status: field.value ? 'confirmed' : 'missing' })),
      };
      persist(next);
      return next;
    });
  }, []);

  const formCompletion = useMemo(() => {
    const required = ['full_name', 'date_of_birth', 'citizenship_number', 'district', 'phone'];
    const completed = required.filter((key) => state.values[key]?.trim()).length;
    return {
      completed,
      total: required.length,
      percentage: Math.round((completed / required.length) * 100),
    };
  }, [state.values]);

  const missingFields = useMemo(
    () => Object.entries(state.values).filter(([, value]) => !value?.trim()).map(([key]) => FIELD_LABELS[key] || key),
    [state.values],
  );

  return {
    fields: state.fields,
    values: state.values,
    setFieldValue,
    setFieldStatus,
    approveAll,
    missingFields,
    formCompletion,
  };
}

