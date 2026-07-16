# NHA ETTM &middot; HRIS Dashboard

An internal Human Resource Information System dashboard for the National Highway Authority's
Electronic Toll and Traffic Management (ETTM) department — employees, attendance, leaves,
schedules, shifts, sites, roles & permissions, and reports, all in one place.

- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui-style components
- **Backend:** Node.js + Express + TypeScript proxy server
- **State/data:** TanStack Query, React Hook Form + Zod, Axios
- **Mock mode by default:** the whole dashboard works immediately, with no live API connection

---

## 1. Project overview

```
nha-ettm-hris/
  client/     React + Vite + TypeScript frontend
  server/     Node.js + Express + TypeScript proxy backend
  .vscode/    Editor settings and recommended extensions
```

The browser **never** talks to `https://ettm.nha.gov.pk/hris_ci/` directly. It calls the local
Node proxy at `/api/*`, which is the only place real credentials and the production host are
configured (`server/.env`). This keeps secrets out of the client bundle entirely.

```
React frontend  →  Node.js proxy server (this repo, port 5000)  →  NHA HRIS API
```

## 2. Requirements

- **Node.js 20 LTS** or later ([nodejs.org](https://nodejs.org))
- **npm** (bundled with Node)
- **Visual Studio Code** (recommended, not required)
- Windows 10/11 or macOS

## 3. Open the folder in VS Code

1. Unzip / clone the project.
2. `File → Open Folder…` and select the `nha-ettm-hris` folder (the one containing this README).
3. When prompted, install the recommended extensions (ESLint, Prettier, Tailwind CSS
   IntelliSense, Auto Rename Tag). VS Code is already configured (`.vscode/settings.json`) to
   format on save, run ESLint fixes, and use the project's own TypeScript version.

## 4. Install dependencies

From the project root:

```bash
npm install
npm run install:all
```

`install:all` installs both `client/` and `server/` dependencies. Every dependency is listed in
each app's own `package.json` — nothing is expected to be installed globally.

## 5. Create your `.env` files

Two separate env files are used — one per app.

```bash
# macOS / Linux
cp client/.env.example client/.env
cp server/.env.example server/.env

# Windows PowerShell
Copy-Item client\.env.example client\.env
Copy-Item server\.env.example server\.env
```

`client/.env` defaults to mock mode:

```env
VITE_APP_API_BASE_URL=/api
VITE_USE_MOCK_API=true
```

`server/.env` holds the real API details, used only when `VITE_USE_MOCK_API=false`:

```env
HRIS_API_BASE_URL=https://ettm.nha.gov.pk/hris_ci/
HRIS_API_KEY=
CORS_ORIGIN=http://localhost:5173
```

Neither file is committed to git (see `.gitignore`), and no real credentials, tokens, or
employee CNIC numbers are included anywhere in this repository.

## 6. Run in mock mode (default, no backend credentials needed)

```bash
npm run dev
```

This starts the frontend (`http://localhost:5173`) and the backend proxy
(`http://localhost:5000`) together via `concurrently`. With `VITE_USE_MOCK_API=true`, all data —
employees, sites, attendance, leaves, schedules, shifts, roles, reports — comes from an in-memory
mock dataset. No live network connection to the NHA API is required.

**Demo login (mock mode only):**

```
Username: admin
Password: admin123
```

## 7. Run in real API mode

1. Set `VITE_USE_MOCK_API=false` in `client/.env`.
2. Fill in `server/.env` with the real `HRIS_API_BASE_URL` (and `HRIS_API_KEY` if the backend
   team confirms one is required — see the TODO list below).
3. `npm run dev` as above. The frontend now calls the Node proxy, which forwards approved
   requests to the real HRIS API. Login uses the real `/login` endpoint; secure HTTP-only
   cookies are used where supported, and no long-lived token is kept in `localStorage`.
4. Expired sessions trigger an automatic redirect to `/login` (401 handling), and users without
   the right role are shown an access-denied message on restricted pages (e.g. Roles &
   Permissions) rather than a broken screen (403 handling).

## 8. Start frontend and backend together vs. separately

```bash
npm run dev                          # both, from the root
npm run dev --prefix client          # frontend only
npm run dev --prefix server          # backend only
```

## 9. TypeScript checks

```bash
npm run typecheck                    # both apps
npm run typecheck --prefix client
npm run typecheck --prefix server
```

## 10. Production build

```bash
npm run build                        # builds client/dist and server/dist
npm run start                        # runs the built server (serves the API proxy)
npm run preview --prefix client      # preview the built frontend locally
```

`npm run build` runs `tsc -b && vite build` for the client and `tsc` for the server — both must
complete with zero TypeScript errors.

## 11. Common Windows PowerShell issues

- **Scripts blocked:** if `npm` commands are blocked by execution policy, run PowerShell as
  Administrator and execute `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- **`cp`/`cp -r` not recognized:** PowerShell uses `Copy-Item`, not `cp` (see step 5 above).
- **Long path errors:** enable long paths via `git config --system core.longpaths true` or
  Windows' long path support setting if `npm install` fails with `ENAMETOOLONG`.

## 12. Common macOS terminal issues

- **Permission denied on `node_modules/.bin`:** run `chmod +x node_modules/.bin/*` inside
  `client/` or `server/`, or simply re-run `npm install`.
- **Wrong Node version via `nvm`:** run `nvm use 20` (or install with `nvm install 20`) before
  `npm install`.

## 13. Fixing port conflicts

- Frontend (`5173`) or backend (`5000`) already in use:
  - macOS/Linux: `lsof -i :5173` (or `:5000`) then `kill -9 <PID>`.
  - Windows: `netstat -ano | findstr :5173` then `taskkill /PID <PID> /F`.
- Or change the port: edit `server: { port }` in `client/vite.config.ts`, and/or `PORT` in
  `server/.env` (remember to update the Vite proxy target and `CORS_ORIGIN` to match).

## 14. Fixing CORS issues

In development, the frontend never calls the backend cross-origin — Vite's dev proxy
(`client/vite.config.ts`) forwards `/api/*` to `http://localhost:5000`, so the browser only ever
sees same-origin requests. If you still see a CORS error:

- Confirm `server/.env`'s `CORS_ORIGIN` matches the URL you're loading the frontend from exactly
  (including port).
- Confirm the backend is actually running (`npm run dev --prefix server`) and reachable at
  `http://localhost:5000/api/health`.

## 15. Clearing the Vite cache

```bash
rm -rf client/node_modules/.vite
# or, from client/
npm run dev -- --force
```

## 16. Security notes

- No API keys, passwords, access tokens, employee CNIC numbers, or other private employee data
  are hardcoded anywhere in this repository.
- The frontend has no code path that calls `https://ettm.nha.gov.pk/hris_ci/` directly — every
  request goes through the local Node proxy, which is the only place real credentials live.
- Session tokens are kept in `sessionStorage` (not `localStorage`) and cleared on logout or on a
  401 response from the API.
- CORS on the backend is restricted to the configured frontend origin; rate limiting
  (`express-rate-limit`) and `helmet` security headers are enabled by default.
- Server logs (`server/src/utils/logger.ts`) redact any field named password, token,
  authorization, apikey, cnic, secret, or similar before printing — and never log full employee
  records.

## 17. Undocumented API — TODO list

The following were referenced in the project brief but their exact request/response shape was
not documented, so they're implemented as typed placeholders with mock data and a `TODO` comment
in the corresponding service file. Confirm with the backend team before relying on them in
production:

- `mobile_attendance` — HTTP method, headers, and payload unconfirmed (`attendance.service.ts`).
- `modules_list`, `employees_list_for_roles_form`, `sites_list_for_roles_form` — used to populate
  the "Add role" form pickers; shapes unconfirmed (`roles.service.ts`).
- **`add_goal` → `Api/AddShift/index`** — this route looks like a copy-paste of the shift-creation
  endpoint rather than a genuine "add goal" route. **Do not use in production until the backend
  team confirms the correct upstream route and payload.** Flagged in
  `server/src/routes/proxy.routes.ts` with a startup-time warning log whenever it's called.
- Shift editing — no `update_shift`-style endpoint was documented, so the edit action on the
  Shifts page is a disabled placeholder with a tooltip explaining why.
- Report download/export and attendance export — no documented file-generation endpoint, so
  these are disabled placeholder buttons.

## 18. What's intentionally simplified

Given the size of the brief, a few lower-traffic areas ship as solid list/detail views rather
than the full feature set described for every page — most notably the Schedules page's calendar
view (marked optional in the brief) is not included, and Reports/Settings download & export
actions are disabled placeholders pending real endpoints. Everything else — Dashboard, Employees,
Attendance, Leaves, Schedules, Shifts, Sites, Roles & Permissions, and the mock/real API switch —
is fully wired and working.
