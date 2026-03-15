import { Request, Response } from 'express';
import { processTypeParamSchema } from '../schemas/autofill.schema';
import { autofillService } from '../services/autofill/service';
import { sendSuccess } from '../utils/response';

export const autofillController = {
  async getByProcessType(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { processType } = processTypeParamSchema.parse(req.params);

    const data = await autofillService.getAutofillForProcessType(userId, processType);
    sendSuccess(res, data);
  },
};
