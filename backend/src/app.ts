import express from 'express';
import userRoutes from './routes/routes.js';
import { apiRateLimit, corsMiddleware, helmetMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const createApp = (includeFallbackHandlers = true) => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(apiRateLimit);
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  app.use('/api/users', userRoutes);

  if (includeFallbackHandlers) {
    app.use(notFoundHandler);
    app.use(errorHandler);
  }

  return app;
};
