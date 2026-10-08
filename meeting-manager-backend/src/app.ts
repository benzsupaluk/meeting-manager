import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Services } from './container.js';
import { errorHandler, notFoundHandler } from './http/middleware/error-handler.js';
import { createRouter } from './http/router.js';

export function createApp(services: Services, options: { corsOrigin?: string } = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigin ? options.corsOrigin.split(',').map((o) => o.trim()) : true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', createRouter(services));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
