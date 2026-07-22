# Deploying to Vercel

This is a monorepo: a React/Vite frontend (`client/`) and an Express proxy
(`server/`). The browser never calls the NHA HRIS API directly — it calls the
proxy at `/api/*`, and the proxy forwards to `https://ettm.nha.gov.pk/hris_ci/`,
cleans the upstream's messy responses, and forwards the user's JWT.

On Vercel the proxy runs as a **serverless function** (`api/index.ts`, which
re-exports the same Express app). `vercel.json` wires everything together, so a
single `git push` deploys both the frontend and the API.

## One-time Vercel project settings

In the Vercel dashboard for this project → **Settings → General**:

- **Root Directory**: must be the **repository root** (leave it blank / `./`).
  If it is set to `client`, change it — otherwise `vercel.json` and the `api/`
  function are ignored and only the frontend deploys (which is what caused the
  blank "Unexpected Application Error!" screen: the frontend had no `/api`).
- **Build Command / Output Directory / Install Command**: leave as default —
  they are defined in `vercel.json`.

No environment variables are required: login needs no API key, and the upstream
URL has a built-in default. To override it, set `HRIS_API_BASE_URL` in
**Settings → Environment Variables**.

## Deploy

```bash
git add .
git commit -m "Deploy HRIS with serverless API proxy"
git push
```

Vercel builds `client/` to static assets and deploys `api/index.ts` as a
function. After it finishes, `/api/health` should return `{"status":"ok"}` and
login should work exactly as it does locally.

## Local development

```bash
npm run install:all   # install client + server deps
npm run dev           # runs client (5173) and server (5000) together
```
