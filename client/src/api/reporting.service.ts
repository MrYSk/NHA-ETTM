import { apiClient, createListCache, matchesSearch } from './client';
import { scopeByEmployee } from '@/lib/access';

/*
 * The Reporting dataset (POST /report_list) — one row per attendance event,
 * with the schedule, shift and timing detail the HR team reviews in a
 * spreadsheet. The upstream returns the whole table (~25k rows) and ignores
 * pagination, so it is fetched once, cached, then filtered and paged locally.
 *
 * The endpoint itself is not scoped server-side, so the caller's own employee
 * scope is applied here: an organisation-wide role (empty scope, e.g. Super
 * Admin) sees everything, a restricted role only sees its own people.
 */
export interface ReportingRecord {
  id: string;
  bioId: string;
  employeeName: string;
  siteName: string;
  designation: string;
  shiftName: string;
  scheduleStart: string;
  scheduleEnd: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workedTime: string;
  earlySitting: string;
  lateSitting: string;
  extraTime: string;
  acceptableTime: string;
  lastUpdated: string;
}

export interface ReportingFilters {
  search?: string;
  siteName?: string;
  /** Biometric ids to include. Empty means every employee in scope. */
  employeeIds?: string[];
  /** Calendar month to report on, as "YYYY-MM". */
  month?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** An employee available in the reporting data, for the officer picker. */
export interface ReportingEmployee {
  bioId: string;
  name: string;
  siteName: string;
  designation: string;
}

interface ReportingRow {
  id: string;
  bio_id: string;
  fullname: string;
  site_name: string;
  designation_name: string;
  shift_name: string;
  schedule_start_date: string;
  schedule_end_date: string;
  attendance_date: string;
  checkin: string;
  checkout: string;
  time: string;
  early_sitting: string;
  late_sitting: string;
  extra_time: string;
  acceptable_time: string;
  last_updated: string | null;
}

// Strip the redundant date prefix the upstream includes on check-in/out
// ("2026-07-28 10:33:38" -> "10:33:38") since the date has its own column.
const timeOnly = (value: string | undefined) => (value ?? '').split(' ')[1] ?? value ?? '';

function mapRow(row: ReportingRow): ReportingRecord {
  return {
    id: row.id,
    bioId: row.bio_id,
    employeeName: row.fullname,
    siteName: row.site_name,
    designation: row.designation_name,
    shiftName: row.shift_name,
    scheduleStart: row.schedule_start_date,
    scheduleEnd: row.schedule_end_date,
    date: row.attendance_date,
    checkIn: timeOnly(row.checkin),
    checkOut: timeOnly(row.checkout),
    workedTime: row.time,
    earlySitting: row.early_sitting,
    lateSitting: row.late_sitting,
    extraTime: row.extra_time,
    acceptableTime: row.acceptable_time,
    lastUpdated: row.last_updated ?? '',
  };
}

const reportingCache = createListCache(async () => {
  const { data } = await apiClient.post<{ attendance_rows?: ReportingRow[] }>('/report_list', {});
  const rows = (data.attendance_rows ?? []).map(mapRow);

  /*
   * De-duplicate to one row per employee per day.
   *
   * The upstream joins each schedule against every attendance date, so an
   * employee who has two overlapping schedules for the same period gets the
   * SAME day returned twice (verified: 25,403 raw rows collapse to 25,051
   * employee-days, and 351 of the 352 duplicated days are byte-identical).
   * Without this, an exported report repeats the same person and date several
   * times over.
   */
  const byEmployeeDay = new Map<string, ReportingRecord>();
  for (const row of rows) {
    const key = `${row.bioId}|${row.date}`;
    const existing = byEmployeeDay.get(key);
    // Keep whichever row records the most worked time, so a duplicate can
    // never hide a real check-in.
    if (!existing || row.workedTime > existing.workedTime) {
      byEmployeeDay.set(key, row);
    }
  }

  const unique = scopeByEmployee([...byEmployeeDay.values()], (r) => r.bioId);
  // Group by person, then run each person's days in order — how a printed
  // attendance report reads.
  return unique.sort(
    (a, b) => a.employeeName.localeCompare(b.employeeName) || a.date.localeCompare(b.date),
  );
});

export async function listReporting(filters: ReportingFilters = {}): Promise<ReportingRecord[]> {
  const all = await reportingCache.get();
  const chosen = filters.employeeIds?.length ? new Set(filters.employeeIds) : null;

  return all.filter(
    (r) =>
      (!chosen || chosen.has(r.bioId)) &&
      // "2026-07" matches every date in that month.
      (!filters.month || r.date.startsWith(filters.month)) &&
      matchesSearch([r.employeeName, r.siteName, r.designation, r.bioId, r.shiftName], filters.search) &&
      (!filters.siteName || r.siteName === filters.siteName) &&
      (!filters.dateFrom || r.date >= filters.dateFrom) &&
      (!filters.dateTo || r.date <= filters.dateTo),
  );
}

/** Distinct site names present in the reporting data, for the site filter. */
export async function listReportingSites(): Promise<string[]> {
  const all = await reportingCache.get();
  return Array.from(new Set(all.map((r) => r.siteName).filter(Boolean))).sort();
}

/** Distinct employees in the reporting data, for the officer picker. */
export async function listReportingEmployees(): Promise<ReportingEmployee[]> {
  const all = await reportingCache.get();
  const byBio = new Map<string, ReportingEmployee>();
  for (const row of all) {
    if (!byBio.has(row.bioId)) {
      byBio.set(row.bioId, {
        bioId: row.bioId,
        name: row.employeeName,
        siteName: row.siteName,
        designation: row.designation,
      });
    }
  }
  return [...byBio.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Months present in the reporting data (newest first), as "YYYY-MM". */
export async function listReportingMonths(): Promise<string[]> {
  const all = await reportingCache.get();
  return Array.from(new Set(all.map((r) => r.date.slice(0, 7)).filter(Boolean))).sort().reverse();
}
