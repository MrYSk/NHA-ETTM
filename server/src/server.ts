import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

app.listen(env.port, () => {
  logger.info(`NHA ETTM HRIS proxy server listening on port ${env.port}`, {
    env: env.nodeEnv,
    hrisApiBaseUrl: env.hrisApiBaseUrl,
  });
});
