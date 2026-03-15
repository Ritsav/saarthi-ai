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
  language_preference: string;
  created_at: Date;
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

  async register(email: string, password: string, name: string): Promise<{ token: string; user: SafeUser }> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
      select: {
        id: true,
        email: true,
        name: true,
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
        language_preference: true,
        created_at: true,
      },
    });
  },
};
