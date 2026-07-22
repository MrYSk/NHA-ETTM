/*
 * Vercel serverless entry point for the HRIS proxy.
 *
 * On Vercel there is no long-running Node process, so the same Express app used
 * locally (server/src/app.ts) is exported here as a serverless function. The
 * `vercel.json` rewrite sends every `/api/*` request to this file, and the
 * Express app — which mounts its routers under `/api` — handles them exactly as
 * it does in local development. This keeps the browser → proxy → NHA API chain
 * identical in production, so the upstream's messy responses are still cleaned
 * and the user's JWT is still forwarded server-side.
 */
import { createApp } from '../server/src/app';

export default createApp();
