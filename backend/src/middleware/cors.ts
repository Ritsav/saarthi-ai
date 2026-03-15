import { CorsOptions } from 'cors';
import { env } from '../config/env';

function parseOrigin(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isAllowedWebOrigin(origin: string): boolean {
  if (origin === env.FRONTEND_URL) {
    return true;
  }

  const parsed = parseOrigin(origin);
  if (!parsed) {
    return false;
  }

  if (
    env.NODE_ENV !== 'production' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  ) {
    return true;
  }

  return false;
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isAllowedWebOrigin(origin)) {
      callback(null, true);
      return;
    }

    if (/^chrome-extension:\/\/[a-z0-9]{32}$/i.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
