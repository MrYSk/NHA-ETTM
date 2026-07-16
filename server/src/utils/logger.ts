import { env } from '../config/env';

// Keys that must never be written to logs, even in development.
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'apikey',
  'api_key',
  'cnic',
  'secret',
  'accesstoken',
  'refreshtoken',
]);

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(val);
    }
    return out;
  }
  return value;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (env.nodeEnv === 'test') return;
    console.log(`[info] ${message}`, meta ? redact(meta) : '');
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[warn] ${message}`, meta ? redact(meta) : '');
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[error] ${message}`, meta ? redact(meta) : '');
  },
};
