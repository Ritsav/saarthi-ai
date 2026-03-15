import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import { env } from './config/env';
import { logger } from './utils/logger';
import { corsOptions } from './middleware/cors';
import { requestIdMiddleware } from './middleware/request-id';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';

import { authRoutes } from './routes/auth.routes';
import { chatRoutes } from './routes/chat.routes';
import { documentRoutes } from './routes/document.routes';
import { processRoutes } from './routes/process.routes';
import { healthRoutes } from './routes/health.routes';

const app = express();

app.use(requestIdMiddleware);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/document', documentRoutes);
app.use('/api/process', processRoutes);

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'saarthi-ai-backend',
      status: 'running',
      phase: 'phase-4-chat-core',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, environment: env.NODE_ENV }, 'Backend server started');
});
