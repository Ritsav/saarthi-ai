import { CorsOptions } from 'cors';
import { env } from '../config/env';

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (origin === env.FRONTEND_URL) {
      callback(null, true);
      return;
    }

    if (/^chrome-extension:\/\/[a-z]{32}$/i.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
};
