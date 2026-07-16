import axios from 'axios';
import { env } from '../config/env';

// The only place in this codebase that talks to the real NHA HRIS API.
// Real credentials (if/when required) are attached here from server-side
// environment variables only — never sent to or stored in the browser.
export const hrisClient = axios.create({
  baseURL: env.hrisApiBaseUrl,
  timeout: env.hrisApiTimeoutMs,
  headers: env.hrisApiKey ? { Authorization: `Bearer ${env.hrisApiKey}` } : undefined,
});
