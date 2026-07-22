import axios from 'axios';
import { env } from '../config/env';

// The only place in this codebase that talks to the real NHA HRIS API.
//
// Auth model (verified against the live server):
// - `login` needs no key or token — just `{username, password}` in the body.
// - Every other route expects the JWT returned by login, sent as
//   `Authorization: Bearer <access_token>`. The proxy forwards that header
//   from the browser per-request (see proxy.routes.ts).
// - Do NOT send an `X-API-KEY` header: the upstream's api_keys table does not
//   exist, so any key value triggers a database error instead of a response.
export const hrisClient = axios.create({
  baseURL: env.hrisApiBaseUrl,
  timeout: env.hrisApiTimeoutMs,
});
