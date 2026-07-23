/*
 * Self-contained Vercel serverless proxy for the NHA HRIS API.
 *
 * This is the production equivalent of the local Express proxy
 * (server/src/*). It is deliberately dependency-light — it needs only `axios`,
 * which is already a dependency of the frontend — so it deploys cleanly
 * whether Vercel's "Root Directory" is the repository root (this file) or the
 * `client/` folder (the copy at client/api/[...path].ts).
 *
 * As a catch-all route (`[...path]`), Vercel sends every `/api/*` request here.
 * The request path is read from `req.url` (not the catch-all query param, whose
 * shape is unreliable across Vercel routing configurations). The handler:
 *   - allow-lists the documented HRIS routes,
 *   - forwards method, query, body and the caller's JWT to the upstream,
 *   - strips the PHP-notice HTML the CodeIgniter server sometimes prepends to
 *     its JSON, and
 *   - forwards the upstream status and (cleaned) body unchanged.
 *
 * Keep this in sync with server/src/routes/proxy.routes.ts.
 */
import axios, { AxiosError } from 'axios';

const HRIS_API_BASE_URL = process.env.HRIS_API_BASE_URL || 'https://ettm.nha.gov.pk/hris_ci/';
const HRIS_API_TIMEOUT_MS = Number(process.env.HRIS_API_TIMEOUT_MS || 30000);

const ALLOWED_ROUTES = new Set([
  'login',
  'user_list',
  'sites_list',
  'designations_list',
  'sites_list_for_schedule',
  'modules_list',
  'employees_list_for_roles_form',
  'sites_list_for_roles_form',
  'shift_list',
  'attendance_list',
  'mobile_attendance',
  'add_user',
  'startdate_leavestatus',
  'check_leave_start_date',
  'check_leave_end_date',
  'enddate_leavestatus',
  'add_schedule',
  'schedule_list',
  'start_schedule_blocked_dates',
  'add_shift',
  'add_goal',
  'add_leave',
  'add_role',
  'update_leave',
  'delete_leave',
  'approve_leave',
  'disapprove_leave',
  'leaves_list',
  'monthly_summary',
  'mobile_summary',
  'site_employees',
  'site_roles',
  'site_role_employees',
  'employees_list_for_filters',
  'roles_list_dropdown',
  'toggle_write_permission',
  'toggle_edit_permission',
  'toggle_approve_permission',
  'toggle_delete_permission',
  'update_employee_role',
  'roles_list',
  'delete_employee_from_pivot',
  'delete_module_from_pivot',
  'delete_site_from_pivot',
  'leave_detail',
  'schedule_detail',
  'attendance_detail',
  'summary_detail',
  'report_list',
  'ssl_test',
]);

// The upstream sends text/html and sometimes prepends PHP-notice markup before
// the JSON, so recover the embedded JSON; anything unparseable passes through.
function parseUpstreamBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  const starts = [data.indexOf('{'), data.indexOf('[')].filter((i) => i !== -1).sort((a, b) => a - b);
  if (starts.length === 0) return data;
  try {
    return JSON.parse(data.slice(starts[0]));
  } catch {
    return data;
  }
}

// Minimal request/response typing so the file needs no extra @vercel/node dep.
interface ProxyRequest {
  method?: string;
  url?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  on?: (event: string, listener: (chunk?: unknown) => void) => void;
  readableEnded?: boolean;
}
interface ProxyResponse {
  status(code: number): ProxyResponse;
  json(body: unknown): void;
}

// Read the raw request stream (used only when the platform did not hand us a
// usable parsed body). Resolves to '' if the stream is already consumed.
function readRawStream(req: ProxyRequest): Promise<string> {
  return new Promise((resolve) => {
    if (typeof req.on !== 'function' || req.readableEnded) {
      resolve('');
      return;
    }
    let raw = '';
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve(raw);
      }
    };
    const timer = setTimeout(finish, 3000);
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      clearTimeout(timer);
      finish();
    });
    req.on('error', () => {
      clearTimeout(timer);
      finish();
    });
  });
}

// Resolve the request body into something axios can forward, regardless of
// whether the serverless platform parsed it into an object, left it as a string
// or Buffer, or did not parse it at all (in which case the raw stream is read).
async function resolveBody(req: ProxyRequest): Promise<unknown> {
  const body = req.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
    const text = Buffer.from(body as Uint8Array).toString('utf8');
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  if (body && typeof body === 'object' && Object.keys(body).length > 0) {
    return body;
  }
  const raw = await readRawStream(req);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return body ?? undefined;
}

export default async function handler(req: ProxyRequest, res: ProxyResponse): Promise<void> {
  // Derive the upstream route from the URL directly. Vercel may present the
  // function URL as "/api/login" or "/login" depending on routing, so strip an
  // optional leading "/api/" and take the remaining segments.
  const [pathname = '', queryString = ''] = (req.url ?? '').split('?');
  const segments = pathname
    .replace(/^\/+/, '')
    .replace(/^api\/+/, '')
    .split('/')
    .filter(Boolean);
  const upstreamPath = segments.join('/');
  const firstSegment = segments[0] ?? '';

  // Local proxy health check (mirrors server/src/routes/health.routes.ts).
  if (firstSegment === 'health') {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    return;
  }

  // TEMP DIAGNOSTIC: forwards to the upstream from the serverless function and
  // reports exactly what the upstream returns, to distinguish a body problem
  // from the upstream rejecting Vercel's servers. Remove once login works.
  if (firstSegment === '__echo') {
    const resolved = await resolveBody(req);
    const obj = (v: unknown): Record<string, unknown> | null =>
      v && typeof v === 'object' && !Buffer.isBuffer(v) ? (v as Record<string, unknown>) : null;
    const ro = obj(resolved);
    const preview = (d: unknown) =>
      typeof d === 'string' ? d.slice(0, 220) : JSON.stringify(d).slice(0, 220);

    // (a) ssl_test: a public upstream route needing no body/credentials.
    let sslStatus: number | string = 'ERR';
    let sslBody = '';
    try {
      const r = await axios.request({
        baseURL: HRIS_API_BASE_URL,
        url: 'ssl_test',
        method: 'GET',
        timeout: HRIS_API_TIMEOUT_MS,
        validateStatus: () => true,
        transformResponse: [(d) => d],
      });
      sslStatus = r.status;
      sslBody = preview(r.data);
    } catch (e) {
      sslBody = (e as Error).message;
    }

    // (b) login: forward the resolved body exactly like the real login path.
    let loginStatus: number | string = 'ERR';
    let loginBody = '';
    try {
      const r = await axios.request({
        baseURL: HRIS_API_BASE_URL,
        url: 'login',
        method: 'POST',
        data: resolved,
        timeout: HRIS_API_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true,
        transformResponse: [(d) => d],
      });
      loginStatus = r.status;
      loginBody = preview(r.data);
    } catch (e) {
      loginBody = (e as Error).message;
    }

    res.status(200).json({
      hasUsername: ro ? typeof ro.username === 'string' && (ro.username as string).length > 0 : false,
      hasPassword: ro ? typeof ro.password === 'string' && (ro.password as string).length > 0 : false,
      baseUrl: HRIS_API_BASE_URL,
      sslTest: { status: sslStatus, body: sslBody },
      login: { status: loginStatus, body: loginBody },
    });
    return;
  }

  if (!ALLOWED_ROUTES.has(firstSegment)) {
    res.status(404).json({ message: `Unknown or unapproved HRIS route: /${upstreamPath}` });
    return;
  }

  // Forward real query params, but drop Vercel's internal catch-all param
  // (it arrives as "...path"/"path") so it is never sent to the upstream.
  const params: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(queryString)) {
    if (key === 'path' || key.startsWith('.')) continue;
    params[key] = value;
  }
  const authorization = req.headers.authorization;
  const contentType = req.headers['content-type'];
  const method = (req.method ?? 'GET').toUpperCase();
  const data = method === 'GET' || method === 'HEAD' ? undefined : await resolveBody(req);

  try {
    const upstream = await axios.request({
      baseURL: HRIS_API_BASE_URL,
      url: upstreamPath,
      method,
      params,
      data,
      timeout: HRIS_API_TIMEOUT_MS,
      headers: {
        'Content-Type': (Array.isArray(contentType) ? contentType[0] : contentType) ?? 'application/json',
        ...(authorization
          ? { Authorization: Array.isArray(authorization) ? authorization[0] : authorization }
          : {}),
      },
      // Forward the real upstream status instead of throwing on 4xx/5xx…
      validateStatus: () => true,
      // …and keep the raw body so we can strip HTML noise ourselves.
      transformResponse: [(d) => d],
    });

    res.status(upstream.status).json(parseUpstreamBody(upstream.data));
  } catch (error) {
    const err = error as AxiosError;
    if (err.code === 'ECONNABORTED') {
      res.status(504).json({ message: 'The upstream HRIS API timed out.' });
      return;
    }
    res.status(502).json({ message: 'Unable to reach the upstream HRIS API.' });
  }
}
