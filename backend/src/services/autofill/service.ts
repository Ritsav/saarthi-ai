import { DocumentStatus, DocumentType, ProcessType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/errors';
import { autofillMapper } from './mapper';
import {
  portalDefinitions,
  portalKeyFromProcessType,
  type PortalDefinition,
  type PortalKey,
} from './portals';

interface SourceDocumentSnapshot {
  id: string;
  document_type: DocumentType;
  ocr_result: unknown;
  validation_result: unknown;
  processed_at: Date | null;
}

function requiredDocumentTypesForPortal(portal: PortalDefinition): DocumentType[] {
  const values = new Set<DocumentType>();

  for (const field of portal.fields) {
    if (field.sourceDocumentType) {
      values.add(field.sourceDocumentType);
      continue;
    }

    if (!field.source) {
      continue;
    }

    const [documentTypeName] = field.source.split('.');
    const value = DocumentType[documentTypeName as keyof typeof DocumentType];
    if (value) {
      values.add(value);
    }
  }

  return [...values];
}

function normalizeDocuments(documents: SourceDocumentSnapshot[]): SourceDocumentSnapshot[] {
  const latestByType = new Map<DocumentType, SourceDocumentSnapshot>();

  for (const document of documents) {
    const existing = latestByType.get(document.document_type);
    if (!existing) {
      latestByType.set(document.document_type, document);
      continue;
    }

    const existingTime = existing.processed_at?.getTime() ?? 0;
    const currentTime = document.processed_at?.getTime() ?? 0;
    if (currentTime >= existingTime) {
      latestByType.set(document.document_type, document);
    }
  }

  return [...latestByType.values()];
}

function parseReadinessScore(validationResult: unknown): number | null {
  if (!validationResult || typeof validationResult !== 'object' || Array.isArray(validationResult)) {
    return null;
  }

  const record = validationResult as Record<string, unknown>;
  if (typeof record.readiness_score === 'number') {
    return record.readiness_score;
  }

  if (typeof record.readinessScore === 'number') {
    return record.readinessScore;
  }

  return null;
}

async function fetchDocumentsForPortal(
  userId: string,
  portal: PortalDefinition,
  processTypeOverride?: ProcessType
) {
  const requiredTypes = requiredDocumentTypesForPortal(portal);
  const processType = processTypeOverride ?? portal.processType;

  const documents = await prisma.document.findMany({
    where: {
      user_id: userId,
      process_type: processType,
      status: DocumentStatus.COMPLETED,
      document_type: { in: requiredTypes },
    },
    orderBy: [
      {
        processed_at: 'desc',
      },
      {
        created_at: 'desc',
      },
    ],
    select: {
      id: true,
      document_type: true,
      ocr_result: true,
      validation_result: true,
      processed_at: true,
    },
  });

  return normalizeDocuments(documents).filter((document) => document.ocr_result !== null);
}

async function getUserProfileDefaults(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      contact_number: true,
      home_phone: true,
      contact_phone: true,
      contact_email: true,
    },
  });
}

function getPortalDefinitionOrThrow(portalKey: PortalKey): PortalDefinition {
  const portal = portalDefinitions[portalKey];
  if (!portal) {
    throw new AppError(404, 'PORTAL_NOT_SUPPORTED', 'Portal is not supported');
  }

  return portal;
}

export const autofillService = {
  listPortals() {
    return Object.values(portalDefinitions).map((portal) => ({
      key: portal.key,
      name: portal.name,
      processType: portal.processType,
      urlPatterns: portal.urlPatterns,
    }));
  },

  async getAutofillForProcessType(userId: string, processType: ProcessType) {
    const portalKey = portalKeyFromProcessType(processType);
    return this.getAutofillForPortal(userId, portalKey);
  },

  async getAutofillForPortal(
    userId: string,
    portalKey: PortalKey,
    processTypeOverride?: ProcessType
  ) {
    const portal = getPortalDefinitionOrThrow(portalKey);
    const documents = await fetchDocumentsForPortal(userId, portal, processTypeOverride);
    const profileDefaults = await getUserProfileDefaults(userId);

    const mapped = autofillMapper.mapPortalFields(portal, documents, profileDefaults ?? undefined);

    return {
      portalKey: portal.key,
      processType: processTypeOverride ?? portal.processType,
      portal: {
        name: portal.name,
        urlPatterns: portal.urlPatterns,
      },
      fields: mapped.fields,
      missingFields: mapped.missingFields,
      warnings: [...new Set(mapped.warnings)],
      manualSteps: portal.manualSteps ?? [],
      formSelectorPlan: portal.formSelectorPlan ?? [],
      generatedAt: new Date().toISOString(),
    };
  },

  async getPortalStatus(userId: string, portalKey: PortalKey, processTypeOverride?: ProcessType) {
    const portal = getPortalDefinitionOrThrow(portalKey);
    const documents = await fetchDocumentsForPortal(userId, portal, processTypeOverride);
    const profileDefaults = await getUserProfileDefaults(userId);
    const mapped = autofillMapper.mapPortalFields(portal, documents, profileDefaults ?? undefined);

    const scores = documents
      .map((document) => parseReadinessScore(document.validation_result))
      .filter((score): score is number => typeof score === 'number');

    const readinessScore =
      scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    return {
      portalKey: portal.key,
      processType: processTypeOverride ?? portal.processType,
      ready: mapped.missingFields.length === 0 && mapped.fields.length > 0,
      readinessScore,
      missingFields: mapped.missingFields,
      warnings: [...new Set(mapped.warnings)],
      manualSteps: portal.manualSteps ?? [],
      formSelectorPlan: portal.formSelectorPlan ?? [],
      updatedAt: new Date().toISOString(),
    };
  },
};
