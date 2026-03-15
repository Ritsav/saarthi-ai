import { Request, Response } from 'express';
import { portalKeyParamSchema, processTypeQuerySchema } from '../schemas/autofill.schema';
import { autofillService } from '../services/autofill/service';
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

    const data = await autofillService.getAutofillForPortal(userId, portalKey, processType);
    sendSuccess(res, data);
  },
};
