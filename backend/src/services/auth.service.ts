import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';

const SALT_ROUNDS = 10;

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  contact_number: string | null;
  home_phone: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  language_preference: string;
  created_at: Date;
}

export interface UserProfileUpdateInput {
  language_preference?: 'en' | 'ne';
  contact_number?: string;
  home_phone?: string;
  contact_phone?: string;
  contact_email?: string;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(userId: string, email: string): string {
    const payload: TokenPayload = { userId, email };
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      ...options,
    });
  },

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  },

  async register(
    email: string,
    password: string,
    name: string,
    profile?: Omit<UserProfileUpdateInput, 'language_preference'>
  ): Promise<{ token: string; user: SafeUser }> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        contact_number: profile?.contact_number,
        home_phone: profile?.home_phone,
        contact_phone: profile?.contact_phone,
        contact_email: profile?.contact_email?.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        contact_number: true,
        home_phone: true,
        contact_phone: true,
        contact_email: true,
        language_preference: true,
        created_at: true,
      },
    });

    const token = this.generateToken(user.id, user.email);
    return { token, user };
  },

  async login(email: string, password: string): Promise<{ token: string; user: SafeUser }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        contact_number: user.contact_number,
        home_phone: user.home_phone,
        contact_phone: user.contact_phone,
        contact_email: user.contact_email,
        language_preference: user.language_preference,
        created_at: user.created_at,
      },
    };
  },

  async getUserById(userId: string): Promise<SafeUser | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        contact_number: true,
        home_phone: true,
        contact_phone: true,
        contact_email: true,
        language_preference: true,
        created_at: true,
      },
    });
  },

  async updateUserProfile(userId: string, input: UserProfileUpdateInput): Promise<SafeUser> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        language_preference: input.language_preference,
        contact_number: input.contact_number,
        home_phone: input.home_phone,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email?.toLowerCase(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        contact_number: true,
        home_phone: true,
        contact_phone: true,
        contact_email: true,
        language_preference: true,
        created_at: true,
      },
    });
  },
};
