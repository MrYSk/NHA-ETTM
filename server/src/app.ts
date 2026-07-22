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
  // Body parsing that is safe on serverless platforms. Vercel (and similar)
  // pre-parse the request body and CONSUME the underlying stream before this
  // Express app runs. If express.json() then re-reads that drained stream it
  // parses "" and overwrites req.body with {}, so the proxied login/POST bodies
  // arrive empty upstream (the NHA API then reports invalid credentials).
  //
  // Fix: only run Express's parsers when the platform hasn't already provided a
  // parsed body. Locally (no platform pre-parse) req.body is undefined, so the
  // parsers run normally.
  const jsonParser = express.json({ limit: '1mb' });
  const urlencodedParser = express.urlencoded({ extended: true, limit: '1mb' });
  app.use((req, res, next) => {
    // If the platform already parsed the body (Vercel always sets req.body when
    // it pre-parses — including to `{}` for an empty-object payload), keep it
    // and do NOT re-read the already-consumed stream, which would replace the
    // real body with `{}` (or hang). Locally req.body is undefined here, so the
    // Express parsers run normally.
    if (req.body !== undefined && req.body !== null) {
      next();
      return;
    }
    jsonParser(req, res, (err) => (err ? next(err) : urlencodedParser(req, res, next)));
  });
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
