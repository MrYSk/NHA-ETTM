import type { NextFunction, Request, Response } from 'express';
import { isAxiosError } from 'axios';
import { logger } from '../utils/logger';
import { isEdgeBlock } from '../routes/proxy.routes';

export interface NormalizedError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export function normalizeUpstreamError(error: unknown): NormalizedError {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return { status: 504, message: 'The upstream HRIS API timed out.' };
    }
    if (!error.response) {
      return { status: 502, message: 'Unable to reach the upstream HRIS API.' };
    }
    const status = error.response.status;

    /*
     * A Cloudflare block arrives here as a 403 carrying an HTML page. Reporting
     * it as 403 would make the UI say "invalid username or password", so it is
     * reported as a gateway failure with an explicit explanation instead.
     */
    if (isEdgeBlock(status, error.response.data)) {
      return {
        status: 502,
        message:
          'The NHA HRIS API refused the request from this server (blocked at its Cloudflare firewall). This is a network restriction, not a wrong username or password — the API only accepts requests from approved networks.',
      };
    }

    // The upstream CodeIgniter API reports failures as `{status:false,error:"..."}`,
    // while some routes use `{message:"..."}`. Surface whichever is present so the
    // real reason (e.g. "Invalid API key") reaches the browser instead of being masked.
    const data = error.response.data as { message?: string; error?: string } | undefined;
    return {
      status,
      message: data?.message ?? data?.error ?? 'The upstream HRIS API returned an error.',
    };
  }
  return { status: 500, message: 'An unexpected error occurred.' };
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const normalized = normalizeUpstreamError(err);
  logger.error('Request failed', { path: req.originalUrl, method: req.method, status: normalized.status });
  res.status(normalized.status).json({ message: normalized.message, fieldErrors: normalized.fieldErrors });
}
