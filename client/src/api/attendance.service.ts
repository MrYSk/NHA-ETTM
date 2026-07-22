import { apiClient, createListCache, paginateList } from './client';
import { getSessionUser } from './auth.service';
import type { AttendanceRecord, AttendanceStatus, MonthlySummary, PaginatedResult } from '@/types';

export interface AttendanceFilters {
  page?: number;
  pageSize?: number;
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
  return items.filter(
    (a) =>
      (!filters.employeeId || String(a.employeeId) === String(filters.employeeId)) &&
      (!filters.siteId || String(a.siteId) === String(filters.siteId)) &&
      (!filters.status || a.status === filters.status) &&
      (!filters.dateFrom || (a.date ?? '') >= filters.dateFrom) &&
      (!filters.dateTo || (a.date ?? '') <= filters.dateTo),
  );
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
  const all = await attendanceCache.get();
  return all.find((a) => String(a.id) === String(id)) ?? (await mobileAttendanceCache.get()).find((a) => String(a.id) === String(id));
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
