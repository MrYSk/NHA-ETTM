import { Router, type Request, type Response, type NextFunction } from 'express';
import { hrisClient } from '../services/hrisClient';
import { logger } from '../utils/logger';

export const proxyRouter = Router();

// Every route documented in the project brief. Only these paths (plus their
// `:param` variants) are proxied through to the upstream HRIS API — nothing
// else is forwarded, so the browser can never reach an undocumented or
// unapproved endpoint through this server.
const ALLOWED_ROUTES = [
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
];

function firstSegment(path: string): string {
  return path.replace(/^\//, '').split('/')[0] ?? '';
}

/*
 * The upstream CodeIgniter server replies with a text/html content type and
 * sometimes prepends PHP notice markup before the JSON payload, so axios
 * hands us a raw string. Recover the embedded JSON so the browser always
 * receives a proper object; anything unparseable passes through untouched.
 */
function parseUpstreamBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  const objStart = data.indexOf('{');
  const arrStart = data.indexOf('[');
  const start = [objStart, arrStart].filter((i) => i !== -1).sort((a, b) => a - b)[0];
  if (start === undefined) return data;
  try {
    return JSON.parse(data.slice(start));
  } catch {
    return data;
  }
}

function isAllowed(path: string): boolean {
  return ALLOWED_ROUTES.includes(firstSegment(path));
}

// DEVELOPER NOTE: `add_goal` is documented as mapping to `Api/AddShift/index`
// upstream, which looks like a copy-paste route rather than a genuine
// "add goal" endpoint. Confirm the correct upstream route and payload shape
// with the backend team before relying on this in production.
const SUSPICIOUS_ROUTES = new Set(['add_goal']);

proxyRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  const upstreamPath = req.path; // everything after the /api mount point

  if (!isAllowed(upstreamPath)) {
    res.status(404).json({ message: `Unknown or unapproved HRIS route: ${upstreamPath}` });
    return;
  }

  if (SUSPICIOUS_ROUTES.has(firstSegment(upstreamPath))) {
    logger.warn('Proxying a route flagged as unconfirmed with the backend team', { path: upstreamPath });
  }

  try {
    logger.info('Proxying request', { method: req.method, path: upstreamPath });

    const upstreamResponse = await hrisClient.request({
      url: upstreamPath,
      method: req.method,
      params: req.query,
      data: req.body,
      headers: {
        // Forward only the headers the upstream actually uses: the content
        // type and the user's own JWT (`Authorization: Bearer <access_token>`
        // from login), which every non-login route requires.
        'Content-Type': req.headers['content-type'] ?? 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
    });

    res.status(upstreamResponse.status).json(parseUpstreamBody(upstreamResponse.data));
  } catch (error) {
    next(error);
  }
});
