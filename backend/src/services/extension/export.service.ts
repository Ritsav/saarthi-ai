import { Prisma, ProcessType } from '@prisma/client';
import { prisma } from '../../config/database';
import { autofillService } from '../autofill/service';
import { portalDefinitions, portalKeyFromProcessType, type PortalKey } from '../autofill/portals';

interface ExportFieldPayload {
  key: string;
  selector: string;
  selectors: string[];
  value: string;
  fieldType?: 'text' | 'date' | 'radio' | 'select';
  options?: Array<{
    value: string;
    label: string;
    selector?: string;
  }>;
  approvalRequired?: boolean;
  formStep?: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
  sectionTitle?: string;
}

interface ExportPayload {
  portalKey: PortalKey;
  processType: ProcessType;
  fields: ExportFieldPayload[];
  source: 'frontend_export';
  exportedAt: string;
}

interface AutofillPayload {
  portalKey: string;
  processType: ProcessType;
  portal: {
    name: string;
    urlPatterns: string[];
  };
  fields: Array<{
    key: string;
    selector: string;
    selectors?: string[];
    value: string;
    fieldType?: 'text' | 'date' | 'radio' | 'select';
    options?: Array<{
      value: string;
      label: string;
      selector?: string;
    }>;
    approvalRequired?: boolean;
    formStep?: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
    sectionTitle?: string;
    sourceDocumentId?: string;
    confidence?: number;
  }>;
  missingFields: string[];
  warnings: string[];
  manualSteps: string[];
  formSelectorPlan: Array<{
    step: string;
    mode: 'auto' | 'manual' | 'mixed';
    selectors: string[];
    notes?: string;
  }>;
  generatedAt: string;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function normalizeFieldType(value: unknown): 'text' | 'date' | 'radio' | 'select' | undefined {
  if (value === 'text' || value === 'date' || value === 'radio' || value === 'select') {
    return value;
  }

  return undefined;
}

function normalizeFormStep(
  value: unknown
): 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5' | undefined {
  if (
    value === 'form_1' ||
    value === 'form_2' ||
    value === 'form_3' ||
    value === 'form_4' ||
    value === 'form_5'
  ) {
    return value;
  }

  return undefined;
}

function parsePayload(value: Prisma.JsonValue | null): ExportPayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.portalKey !== 'string' ||
    typeof record.processType !== 'string' ||
    !Array.isArray(record.fields)
  ) {
    return null;
  }

  const fields = record.fields
    .filter((field): field is Record<string, unknown> => {
      return Boolean(field && typeof field === 'object' && !Array.isArray(field));
    })
      .map((field) => ({
        key: String(field.key ?? ''),
        selector: String(field.selector ?? ''),
        selectors: Array.isArray(field.selectors)
          ? field.selectors.map((item) => String(item))
          : [],
        value: String(field.value ?? ''),
        fieldType: normalizeFieldType(field.fieldType),
        options: Array.isArray(field.options)
          ? field.options
              .filter((option): option is Record<string, unknown> =>
                Boolean(option && typeof option === 'object' && !Array.isArray(option))
              )
              .map((option) => ({
                value: String(option.value ?? ''),
                label: String(option.label ?? ''),
                selector:
                  typeof option.selector === 'string' && option.selector.trim().length > 0
                    ? option.selector
                    : undefined,
              }))
          : undefined,
        approvalRequired:
          typeof field.approvalRequired === 'boolean' ? field.approvalRequired : undefined,
        formStep: normalizeFormStep(field.formStep),
        sectionTitle:
          typeof field.sectionTitle === 'string' && field.sectionTitle.trim().length > 0
            ? field.sectionTitle
            : undefined,
      }))
    .filter((field) => field.key.trim().length > 0);

  return {
    portalKey: record.portalKey as PortalKey,
    processType: record.processType as ProcessType,
    fields,
    source: 'frontend_export',
    exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : new Date().toISOString(),
  };
}

function recalculateMissingFields(
  portalKey: PortalKey,
  fields: Array<{ key: string; value: string }>
): string[] {
  const portal = portalDefinitions[portalKey];
  const valueByKey = new Map(fields.map((field) => [field.key, field.value]));

  return portal.fields
    .filter((mapping) => mapping.required)
    .filter((mapping) => !(valueByKey.get(mapping.key) || '').trim())
    .map((mapping) => mapping.selector);
}

export const extensionExportService = {
  async exportFromProcessForm(
    userId: string,
    processType: ProcessType,
    overrides: Record<string, string>
  ) {
    const portalKey = portalKeyFromProcessType(processType);
    const portal = portalDefinitions[portalKey];
    const autofill = await autofillService.getAutofillForPortal(userId, portalKey, processType);
    const mappedByKey = new Map(autofill.fields.map((field) => [field.key, field]));

    const fields: ExportFieldPayload[] = portal.fields
      .map((mapping) => {
        const overrideValue = typeof overrides[mapping.key] === 'string' ? overrides[mapping.key].trim() : '';
        const mappedValue = mappedByKey.get(mapping.key)?.value?.trim() ?? '';
        const value = overrideValue || mappedValue;

        return {
          key: mapping.key,
          selector: mapping.selector,
          selectors: mapping.selectors ?? [mapping.selector],
          value,
          fieldType: normalizeFieldType(mapping.fieldType),
          options: mapping.options,
          approvalRequired: mapping.approvalRequired,
          formStep: normalizeFormStep(mapping.formStep),
          sectionTitle: mapping.sectionTitle,
        };
      })
      .filter((field) => field.value.length > 0);

    const payload: ExportPayload = {
      portalKey,
      processType,
      fields,
      source: 'frontend_export',
      exportedAt: new Date().toISOString(),
    };

    await prisma.extensionExport.upsert({
      where: {
        user_id_process_type_portal_key: {
          user_id: userId,
          process_type: processType,
          portal_key: portalKey,
        },
      },
      update: {
        payload: toJsonValue(payload),
      },
      create: {
        user_id: userId,
        process_type: processType,
        portal_key: portalKey,
        payload: toJsonValue(payload),
      },
    });

    const missingFields = recalculateMissingFields(portalKey, fields);

    return {
      portalKey,
      processType,
      exportedCount: fields.length,
      missingCount: missingFields.length,
      exportedAt: payload.exportedAt,
    };
  },

  async mergeWithSavedExport(
    userId: string,
    portalKey: PortalKey,
    processType: ProcessType,
    base: AutofillPayload
  ): Promise<AutofillPayload> {
    const saved = await prisma.extensionExport.findUnique({
      where: {
        user_id_process_type_portal_key: {
          user_id: userId,
          process_type: processType,
          portal_key: portalKey,
        },
      },
      select: {
        payload: true,
      },
    });

    if (!saved) {
      return base;
    }

    const parsed = parsePayload(saved.payload);
    if (!parsed) {
      return base;
    }

    const mergedByKey = new Map(base.fields.map((field) => [field.key, field]));
    for (const exportedField of parsed.fields) {
      if (!exportedField.value.trim()) {
        continue;
      }

      const existing = mergedByKey.get(exportedField.key);
      if (existing) {
        mergedByKey.set(exportedField.key, {
          ...existing,
          value: exportedField.value,
          selector: exportedField.selector || existing.selector,
          selectors: exportedField.selectors?.length ? exportedField.selectors : existing.selectors,
          fieldType: exportedField.fieldType ?? existing.fieldType,
          options: exportedField.options?.length ? exportedField.options : existing.options,
          approvalRequired:
            typeof exportedField.approvalRequired === 'boolean'
              ? exportedField.approvalRequired
              : existing.approvalRequired,
          formStep: exportedField.formStep ?? existing.formStep,
          sectionTitle: exportedField.sectionTitle ?? existing.sectionTitle,
        });
      } else {
        mergedByKey.set(exportedField.key, {
          key: exportedField.key,
          selector: exportedField.selector,
          selectors: exportedField.selectors,
          value: exportedField.value,
          fieldType: exportedField.fieldType,
          options: exportedField.options,
          approvalRequired: exportedField.approvalRequired,
          formStep: exportedField.formStep,
          sectionTitle: exportedField.sectionTitle,
        });
      }
    }

    const mergedFields = [...mergedByKey.values()];
    const missingFields = recalculateMissingFields(portalKey, mergedFields);

    return {
      ...base,
      fields: mergedFields,
      missingFields,
      warnings:
        parsed.fields.length > 0
          ? [...new Set([...base.warnings, 'Using exported values from frontend'])]
          : base.warnings,
    };
  },
};
