import { ProcessType } from '@prisma/client';
import { Request, Response } from 'express';
import { portalKeyParamSchema, processTypeQuerySchema } from '../schemas/autofill.schema';
import { exportToExtensionBodySchema } from '../schemas/extension.schema';
import { autofillService } from '../services/autofill/service';
import { portalDefinitions } from '../services/autofill/portals';
import { extensionExportService } from '../services/extension/export.service';
import { sendSuccess } from '../utils/response';

export const extensionController = {
  async listPortals(_req: Request, res: Response): Promise<void> {
    const portals = autofillService.listPortals();
    sendSuccess(res, { portals });
  },

  async getStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { portalKey } = portalKeyParamSchema.parse(req.params);
    const { processType } = processTypeQuerySchema.parse(req.query ?? {});

    const status = await autofillService.getPortalStatus(userId, portalKey, processType);
    sendSuccess(res, status);
  },

  async getAutofill(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { portalKey } = portalKeyParamSchema.parse(req.params);
    const { processType } = processTypeQuerySchema.parse(req.query ?? {});
    const resolvedProcessType = processType ?? portalDefinitions[portalKey].processType;

    const data = await autofillService.getAutofillForPortal(
      userId,
      portalKey,
      resolvedProcessType
    );
    const merged = await extensionExportService.mergeWithSavedExport(
      userId,
      portalKey,
      resolvedProcessType,
      data
    );
    sendSuccess(res, merged);
  },

  async exportFromForm(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const parsed = exportToExtensionBodySchema.parse(req.body ?? {});
    const processType = parsed.process_type ?? ProcessType.PASSPORT_APPLICATION;

    const result = await extensionExportService.exportFromProcessForm(
      userId,
      processType,
      parsed.values
    );
    sendSuccess(res, result);
  },
};
