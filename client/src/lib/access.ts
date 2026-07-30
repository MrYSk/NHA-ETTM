import { getSessionUser } from '@/api/auth.service';

/*
 * Per-user access control, driven entirely by the login response.
 *
 * The HRIS login returns what the signed-in user is actually allowed to do and
 * see:
 *   - read/write/edit/approval/delete permission flags, and
 *   - `employees` (biometric ids) and `sites` (site ids) they are responsible
 *     for.
 *
 * The UI honours both: action buttons are gated on the permission flags, and
 * every list is narrowed to the user's own employees/sites. A user managing
 * four people therefore sees those four, not the whole organisation.
 *
 * An EMPTY scope array means "not restricted to a subset" (organisation-wide
 * roles), which matches how the upstream treats these lists.
 */

export interface AccessScope {
  /** Biometric ids this user may see, or null when unrestricted. */
  employeeIds: Set<string> | null;
  /** Site ids this user may see, or null when unrestricted. */
  siteIds: Set<string> | null;
}

export function getScope(): AccessScope {
  const user = getSessionUser();
  const employees = user?.employeeIds ?? [];
  const sites = user?.siteIds ?? [];
  return {
    employeeIds: employees.length ? new Set(employees.map(String)) : null,
    siteIds: sites.length ? new Set(sites.map(String)) : null,
  };
}

/** Keep only the rows whose employee (biometric id) is inside the user's scope. */
export function scopeByEmployee<T>(items: T[], getBioId: (item: T) => unknown): T[] {
  const { employeeIds } = getScope();
  if (!employeeIds) return items;
  return items.filter((item) => employeeIds.has(String(getBioId(item) ?? '')));
}

/** Keep only the rows whose site is inside the user's scope. */
export function scopeBySite<T>(items: T[], getSiteId: (item: T) => unknown): T[] {
  const { siteIds } = getScope();
  if (!siteIds) return items;
  return items.filter((item) => siteIds.has(String(getSiteId(item) ?? '')));
}
