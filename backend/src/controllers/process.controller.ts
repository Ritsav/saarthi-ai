import { Request, Response } from 'express';
import { processTypeParamSchema } from '../schemas/autofill.schema';
import { processService } from '../services/process.service';
import { sendSuccess } from '../utils/response';

export const processController = {
  async list(_req: Request, res: Response): Promise<void> {
    const processes = processService.listProcesses();
    sendSuccess(res, { processes });
  },

  async checklist(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { processType } = processTypeParamSchema.parse(req.params);

    const checklist = await processService.getChecklist(userId, processType);
    sendSuccess(res, checklist);
  },

  async formDefinition(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { processType } = processTypeParamSchema.parse(req.params);

    const formDefinition = await processService.getFormDefinition(userId, processType);
    sendSuccess(res, formDefinition);
  },
};
