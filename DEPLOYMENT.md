# Deploying to Vercel

This is a monorepo: a React/Vite frontend (`client/`) and an Express proxy
(`server/`) used for local development. The browser never calls the NHA HRIS API
directly — it calls `/api/*`, which forwards to
`https://ettm.nha.gov.pk/hris_ci/`, cleans the upstream's messy responses, and
forwards the user's JWT.

On Vercel the proxy runs as a **serverless function** — a self-contained handler
(`api/[...path].ts`) that needs only `axios`. To work no matter how the Vercel
project's **Root Directory** is configured, the same function and a `vercel.json`
exist in **two** places:

- Repo root: `api/[...path].ts` + `vercel.json` — used when Root Directory is the
  repository root.
- `client/`: `client/api/[...path].ts` + `client/vercel.json` — used when Root
  Directory is `client`.

Only the copy inside the active Root Directory is used; the other is ignored.
So a plain `git push` deploys correctly either way — no dashboard changes needed.

## Environment variables

None are required. Login needs no API key, and the upstream URL has a built-in
default. To point at a different upstream, set `HRIS_API_BASE_URL` in the Vercel
project's **Settings → Environment Variables**.

## Deploy

```bash
git add -A
git commit -m "Deploy HRIS with self-contained serverless API proxy"
git push
```

After it finishes, `/api/health` returns `{"status":"ok"}` and login works the
same as locally.

## Local development

```bash
npm run install:all   # install client + server deps
npm run dev           # runs client (5173) and server (5000) together
```

If `npm run dev` ever leaves processes running, free the ports with:

```bash
lsof -ti :5173 :5000 | xargs kill -9
```
