import { DocumentStatus, DocumentType, ProcessType } from '@prisma/client';
import { prisma } from '../config/database';
import { autofillService } from './autofill/service';
import { portalDefinitions, portalKeyFromProcessType } from './autofill/portals';

type RequirementStatus = 'completed' | 'missing' | 'invalid';

interface ProcessDescriptor {
  type: ProcessType;
  name: string;
  description: string;
  authority: string;
  estimated_time: string;
  government_fee: string;
}

const processCatalog: ProcessDescriptor[] = [
  {
    type: ProcessType.PASSPORT_APPLICATION,
    name: 'Passport Application',
    description: 'Review document extraction and prepare fields for Nepal passport portal.',
    authority: 'Department of Passports, Nepal',
    estimated_time: 'Varies by appointment and verification',
    government_fee: 'As per passport type and service class',
  },
];

function toPortalUrl(urlPattern: string): string {
  return urlPattern.replace(/\/\*$/, '');
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

function fieldLabelFromKey(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function defaultLabelFromOption(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function parseReadinessScore(value: unknown): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.readiness_score === 'number') {
    return record.readiness_score;
  }

  if (typeof record.readinessScore === 'number') {
    return record.readinessScore;
  }

  return 0;
}

function parseValidity(value: unknown): boolean | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.is_valid === 'boolean') {
    return record.is_valid;
  }

  if (typeof record.isValid === 'boolean') {
    return record.isValid;
  }

  return null;
}

function requirementLabelForDocumentType(documentType: DocumentType): string {
  const lookup: Partial<Record<DocumentType, string>> = {
    [DocumentType.CITIZENSHIP]: 'Citizenship document',
    [DocumentType.PASSPORT_PHOTO]: 'Passport photo',
    [DocumentType.BIRTH_CERTIFICATE]: 'Birth certificate',
    [DocumentType.UTILITY_BILL]: 'Utility bill',
    [DocumentType.RENTAL_AGREEMENT]: 'Rental agreement',
    [DocumentType.OTHER]: 'Supporting document',
  };

  return lookup[documentType] ?? toTitleCase(documentType);
}

function requiredDocumentTypesForProcess(processType: ProcessType): DocumentType[] {
  const portal = portalDefinitions[portalKeyFromProcessType(processType)];
  const required = new Set<DocumentType>();

  for (const field of portal.fields) {
    if (field.sourceDocumentType) {
      required.add(field.sourceDocumentType);
      continue;
    }

    if (!field.source) {
      continue;
    }

    const [documentTypeName] = field.source.split('.');
    const documentType = DocumentType[documentTypeName as keyof typeof DocumentType];
    if (documentType) {
      required.add(documentType);
    }
  }

  return [...required];
}

export const processService = {
  listProcesses() {
    return processCatalog.map((process) => {
      const portal = portalDefinitions[portalKeyFromProcessType(process.type)];

      return {
        ...process,
        portal_key: portal.key,
        portal_name: portal.name,
        portal_url: toPortalUrl(portal.urlPatterns[0] ?? ''),
      };
    });
  },

  async getChecklist(userId: string, processType: ProcessType) {
    const requiredDocumentTypes = requiredDocumentTypesForProcess(processType);

    const documents = await prisma.document.findMany({
      where: {
        user_id: userId,
        process_type: processType,
        status: DocumentStatus.COMPLETED,
        document_type: { in: requiredDocumentTypes },
      },
      orderBy: [{ processed_at: 'desc' }, { created_at: 'desc' }],
      select: {
        id: true,
        document_type: true,
        validation_result: true,
      },
    });

    const latestByType = new Map<DocumentType, (typeof documents)[number]>();
    for (const document of documents) {
      if (!latestByType.has(document.document_type)) {
        latestByType.set(document.document_type, document);
      }
    }

    const checklist = requiredDocumentTypes.map((documentType) => {
      const latest = latestByType.get(documentType);
      const readinessScore = parseReadinessScore(latest?.validation_result);
      const isValid = parseValidity(latest?.validation_result);

      let status: RequirementStatus = 'missing';
      if (latest) {
        status = isValid === false || readinessScore < 50 ? 'invalid' : 'completed';
      }

      return {
        requirement: requirementLabelForDocumentType(documentType),
        document_type: documentType,
        status,
        readiness_score: latest ? readinessScore : 0,
        document_id: latest?.id ?? null,
        notes:
          status === 'missing'
            ? 'Upload this document to continue.'
            : status === 'invalid'
              ? 'Document was detected but needs correction.'
              : 'Latest document is available for autofill.',
      };
    });

    const overallReadiness =
      checklist.length > 0
        ? Math.round(
            checklist.reduce((sum, item) => sum + item.readiness_score, 0) /
              checklist.length
          )
        : 0;

    return {
      process_type: processType,
      overall_readiness: overallReadiness,
      checklist,
      generated_at: new Date().toISOString(),
    };
  },

  async getFormDefinition(userId: string, processType: ProcessType) {
    const portalKey = portalKeyFromProcessType(processType);
    const portal = portalDefinitions[portalKey];
    const autofill = await autofillService.getAutofillForPortal(userId, portalKey, processType);

    const mappedByKey = new Map(autofill.fields.map((field) => [field.key, field]));

    const sectionMap = new Map<
      string,
      {
        id: string;
        title: string;
        fields: Array<{
          key: string;
          label: string;
          required: boolean;
          source: string;
          source_document_type: string;
          source_field: string;
          selector: string;
          selectors: string[];
          value: string;
          confidence: number | null;
          status: 'mapped' | 'missing';
          field_type: 'text' | 'date' | 'radio' | 'select';
          options: Array<{
            value: string;
            label: string;
            selector?: string;
          }>;
          approval_required: boolean;
          form_step: 'form_1' | 'form_2' | 'form_3' | 'form_4' | 'form_5';
          section_title: string;
        }>;
      }
    >();

    const fields = portal.fields.map((field) => {
      const mapped = mappedByKey.get(field.key);
      const [sourceDocumentType = 'MANUAL', ...sourcePathParts] = (field.source ?? 'MANUAL').split('.');
      const sourceField = sourcePathParts.join('.');
      const sectionTitle = field.sectionTitle ?? `${toTitleCase(sourceDocumentType)} Fields`;
      const sectionId = sectionTitle.toLowerCase().replace(/\s+/g, '_');

      const hydratedField = {
        key: field.key,
        label: fieldLabelFromKey(field.key),
        required: Boolean(field.required),
        source: field.source ?? 'MANUAL',
        source_document_type: sourceDocumentType,
        source_field: sourceField,
        selector: field.selector,
        selectors: field.selectors ?? [field.selector],
        value: mapped?.value ?? '',
        confidence: typeof mapped?.confidence === 'number' ? mapped.confidence : null,
        status: mapped?.value ? ('mapped' as const) : ('missing' as const),
        field_type: field.fieldType ?? 'text',
        options:
          field.options?.map((option) => ({
            value: option.value,
            label: option.label || defaultLabelFromOption(option.value),
            selector: option.selector,
          })) ?? [],
        approval_required: Boolean(field.approvalRequired),
        form_step: field.formStep ?? 'form_3',
        section_title: sectionTitle,
      };

      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: sectionId,
          title: sectionTitle,
          fields: [],
        });
      }

      sectionMap.get(sectionId)!.fields.push(hydratedField);
      return hydratedField;
    });

    const sections = [...sectionMap.values()].map((section) => ({
      ...section,
      completed: section.fields.filter((field) => field.value.trim().length > 0).length,
      total: section.fields.length,
    }));

    return {
      process_type: processType,
      portal_key: portal.key,
      portal_name: portal.name,
      portal_url_patterns: portal.urlPatterns,
      fields,
      sections,
      missing_fields: autofill.missingFields,
      warnings: autofill.warnings,
      manual_steps: autofill.manualSteps,
      form_selector_plan: autofill.formSelectorPlan,
      generated_at: new Date().toISOString(),
    };
  },
};
