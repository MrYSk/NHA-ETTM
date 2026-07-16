import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),

  // Base URL of the real NHA HRIS API. This value — and any credentials
  // needed to reach it — must live only here, never in the client bundle.
  hrisApiBaseUrl: requireEnv('HRIS_API_BASE_URL', 'https://ettm.nha.gov.pk/hris_ci/'),
  hrisApiTimeoutMs: Number(process.env.HRIS_API_TIMEOUT_MS ?? 15000),

  // Optional static API key/token for the upstream HRIS API, if/when the
  // backend team confirms one is required. Never logged, never echoed back.
  hrisApiKey: process.env.HRIS_API_KEY,

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',

  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
};
