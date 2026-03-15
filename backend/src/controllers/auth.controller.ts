import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated.email, validated.password, validated.name);

    res.status(201).json({
      success: true,
      data: result,
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const validated = loginSchema.parse(req.body);
    const result = await authService.login(validated.email, validated.password);

    res.status(200).json({
      success: true,
      data: result,
    });
  },

  async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  },
};
