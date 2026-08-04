import { apiClient, createListCache, matchesSearch, paginateList } from './client';
import { getSessionUser } from './auth.service';
import { scopeByEmployee } from '@/lib/access';
import type { AttendanceRecord, AttendanceStatus, MonthlySummary, PaginatedResult } from '@/types';

export interface AttendanceFilters {
  page?: number;
  pageSize?: number;
  /** Free-text match on employee name, biometric id, or site. */
  search?: string;
  employeeId?: string | number;
  siteId?: string | number;
  status?: AttendanceStatus;
  dateFrom?: string;
  dateTo?: string;
}

/*
 * Real row shape of `attendance_list` / `mobile_attendance` / `report_list`
 * (verified against the live API). Every row is an actual check-in event,
 * so its status is always "present".
 */
export interface AttendanceRow {
  id: string;
  schedule_start_date: string;
  schedule_end_date: string;
  bio_id: string;
  fullname: string;
  site: string;
  site_name: string;
  designation: string;
  designation_name: string;
  shift_name: string;
  shift_type: string;
  attendance_date: string;
  checkin: string;
  checkout: string;
  time: string;
  acceptable_time: string;
  last_updated: string | null;
}

function mapAttendance(source: 'terminal' | 'mobile') {
  return (row: AttendanceRow): AttendanceRecord => ({
    id: row.id,
    employeeId: row.bio_id,
    employeeName: row.fullname,
    siteId: row.site,
    siteName: row.site_name,
    date: row.attendance_date,
    checkIn: row.checkin,
    checkOut: row.checkout,
    status: 'present',
    source,
  });
}

// The upstream returns the complete attendance dataset regardless of
// pagination (a large payload) — fetch once, cache, and slice client-side.
const attendanceCache = createListCache(async () => {
  const { data } = await apiClient.post<{ attendance_rows: AttendanceRow[] }>('/attendance_list', {});
  return (data.attendance_rows ?? []).map(mapAttendance('terminal'));
});

const mobileAttendanceCache = createListCache(async () => {
  const { data } = await apiClient.post<{ attendance_rows: AttendanceRow[] }>('/mobile_attendance', {});
  return (data.attendance_rows ?? []).map(mapAttendance('mobile'));
});

function applyFilters(items: AttendanceRecord[], filters: AttendanceFilters): AttendanceRecord[] {
  // Only records for employees this user is responsible for.
  return scopeByEmployee(items, (a) => a.employeeId).filter(
    (a) =>
      (!filters.employeeId || String(a.employeeId) === String(filters.employeeId)) &&
      (!filters.siteId || String(a.siteId) === String(filters.siteId)) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.dateFrom || (a.date ?? '') >= filters.dateFrom) &&
      (!filters.dateTo || (a.date ?? '') <= filters.dateTo) &&
      matchesSearch([a.employeeName, String(a.employeeId ?? ''), a.siteName], filters.search),
  );
}

/*
 * Every record matching the filters, ignoring pagination — used by the export
 * so a download covers the whole filtered set, not just the visible page.
 */
export async function listAllAttendance(
  filters: AttendanceFilters,
  source: 'terminal' | 'mobile' = 'terminal',
): Promise<AttendanceRecord[]> {
  const cache = source === 'mobile' ? mobileAttendanceCache : attendanceCache;
  return applyFilters(await cache.get(), filters);
}

export async function listAttendance(filters: AttendanceFilters): Promise<PaginatedResult<AttendanceRecord>> {
  const all = await attendanceCache.get();
  return paginateList(applyFilters(all, filters), filters.page, filters.pageSize);
}

export async function listMobileAttendance(filters: AttendanceFilters): Promise<PaginatedResult<AttendanceRecord>> {
  const all = await mobileAttendanceCache.get();
  return paginateList(applyFilters(all, filters), filters.page, filters.pageSize);
}

export async function getAttendanceDetail(id: AttendanceRecord['id']): Promise<AttendanceRecord | undefined> {
  const matches = (records: AttendanceRecord[]) =>
    scopeByEmployee(records, (a) => a.employeeId).find((a) => String(a.id) === String(id));
  return matches(await attendanceCache.get()) ?? matches(await mobileAttendanceCache.get());
}

/** One day of attendance: the network total plus a per-site breakdown. */
export interface AttendanceDay {
  date: string;
  present: number;
  /** Distinct employees present, keyed by site id. */
  bySite: Record<string, number>;
}

export interface AttendanceStats {
  /** The most recent date with check-ins (YYYY-MM-DD), if any. */
  latestDate?: string;
  /** Distinct employees present on `latestDate`, network-wide. */
  presentCount: number;
  /** Present on `latestDate`, keyed by site id. */
  presentBySite: Record<string, number>;
  /** Sites that appear anywhere in the attendance data, for the site filter. */
  sites: { id: string; name: string }[];
  /** The last `TREND_DAYS` days, oldest→newest. */
  daily: AttendanceDay[];
}

const TREND_DAYS = 14;

/*
 * Attendance headline figures for the dashboard, derived from the same cached
 * attendance list the Attendance page uses (the upstream offers no aggregate
 * endpoint and ignores date filters, so this is computed client-side).
 *
 * Counts are of DISTINCT employees, not check-in rows: one person punching in
 * several times in a day is still one person present.
 */
export async function getAttendanceStats(): Promise<AttendanceStats> {
  const records = scopeByEmployee(await attendanceCache.get(), (a) => a.employeeId);

  // date -> site id -> set of employee ids ("" bucket holds the day's total)
  const byDate = new Map<string, Map<string, Set<string>>>();
  const siteNames = new Map<string, string>();

  for (const record of records) {
    const date = record.date;
    if (!date) continue;
    const employee = String(record.employeeId ?? '');
    const siteId = String(record.siteId ?? '');
    if (siteId && record.siteName) siteNames.set(siteId, record.siteName);

    const sites = byDate.get(date) ?? new Map<string, Set<string>>();
    for (const key of ['', siteId]) {
      if (key === '' || key) {
        const set = sites.get(key) ?? new Set<string>();
        set.add(employee);
        sites.set(key, set);
      }
    }
    byDate.set(date, sites);
  }

  const countsFor = (date: string | undefined): Record<string, number> => {
    const sites = date ? byDate.get(date) : undefined;
    const out: Record<string, number> = {};
    if (!sites) return out;
    for (const [siteId, set] of sites) {
      if (siteId) out[siteId] = set.size;
    }
    return out;
  };

  const dates = Array.from(byDate.keys()).sort();
  const latestDate = dates[dates.length - 1];

  return {
    latestDate,
    presentCount: latestDate ? (byDate.get(latestDate)?.get('')?.size ?? 0) : 0,
    presentBySite: countsFor(latestDate),
    sites: Array.from(siteNames, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    daily: dates.slice(-TREND_DAYS).map((date) => ({
      date,
      present: byDate.get(date)?.get('')?.size ?? 0,
      bySite: countsFor(date),
    })),
  };
}

interface SummaryRow {
  id: string;
  fullname: string;
  bio_id: string;
  site_name: string;
  designation_name: string;
  schedule_start_date: string;
  schedule_end_date: string;
  shift_type: string;
  total_hrs: string;
  hq_hrs?: string;
  site_hrs?: string;
  total_time: string;
  total_acceptable_time: string;
}

/*
 * POST /monthly_summary requires the caller's `employees` id array (from the
 * login response) — without it the API answers 401 "employees array required
 * for this role". This endpoint does honor pagination.
 */
export async function getMonthlySummary(): Promise<MonthlySummary[]> {
  const employees = getSessionUser()?.employeeIds ?? [];
  const { data } = await apiClient.post<{ summary_rows: SummaryRow[] }>('/monthly_summary', {
    pagesize: 500,
    page: 1,
    employees,
  });
  return (data.summary_rows ?? []).map((row) => ({
    id: row.id,
    employeeName: row.fullname,
    siteName: row.site_name,
    designation: row.designation_name,
    scheduleStart: row.schedule_start_date,
    scheduleEnd: row.schedule_end_date,
    shiftType: row.shift_type,
    totalHours: row.total_hrs,
    hqHours: row.hq_hrs,
    siteHours: row.site_hrs,
    totalTime: row.total_time,
    acceptableTime: row.total_acceptable_time,
  }));
}
