import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { healthRouter } from './routes/health.routes';
import { proxyRouter } from './routes/proxy.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      // Restricted to the local Vite dev server (or configured origin) —
      // this proxy is not intended to be a public, open API.
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(apiRateLimiter);

  app.use((req, _res, next) => {
    logger.info('Incoming request', { method: req.method, path: req.path });
    next();
  });

  app.use('/api', healthRouter);
  app.use('/api', proxyRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
