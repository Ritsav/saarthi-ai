import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
  contact_number: z.string().trim().min(3).max(30).optional(),
  home_phone: z.string().trim().min(3).max(30).optional(),
  contact_phone: z.string().trim().min(3).max(30).optional(),
  contact_email: z.string().email().max(255).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const meUpdateSchema = z
  .object({
    language_preference: z.enum(['en', 'ne']).optional(),
    contact_number: z.string().trim().max(30).optional(),
    home_phone: z.string().trim().max(30).optional(),
    contact_phone: z.string().trim().max(30).optional(),
    contact_email: z.string().email().max(255).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const validated = registerSchema.parse(req.body);
    const result = await authService.register(validated.email, validated.password, validated.name, {
      contact_number: validated.contact_number,
      home_phone: validated.home_phone,
      contact_phone: validated.contact_phone,
      contact_email: validated.contact_email,
    });

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

  async updateMe(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const validated = meUpdateSchema.parse(req.body);

    const user = await authService.updateUserProfile(userId, validated);

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
};
