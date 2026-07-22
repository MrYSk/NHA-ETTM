import { apiClient, createListCache, matchesSearch } from './client';
import type { AttendanceRow } from './attendance.service';
import type { Report } from '@/types';

export interface ReportFilters {
  search?: string;
  siteId?: string | number;
  dateFrom?: string;
  dateTo?: string;
}

// Newest entries first; cap how many report cards render at once.
const MAX_REPORT_CARDS = 60;

/*
 * POST /report_list returns the raw attendance reporting rows (same shape as
 * attendance_list, verified against the live API). Each row is presented as
 * one report entry in the existing card UI.
 */
const reportsCache = createListCache(async () => {
  const { data } = await apiClient.post<{ attendance_rows: AttendanceRow[] }>('/report_list', {});
  return (data.attendance_rows ?? []).map(
    (row, index): Report => ({
      // Upstream report rows can repeat ids — suffix the index so React
      // list keys stay unique.
      id: `${row.id}-${index}`,
      title: `${row.fullname} — ${row.attendance_date}`,
      type: row.shift_name || 'Attendance',
      siteName: row.site_name,
      dateRange: `${row.schedule_start_date} – ${row.schedule_end_date}`,
      generatedOn: row.attendance_date,
    }),
  );
});

export async function listReports(filters: ReportFilters): Promise<Report[]> {
  const all = await reportsCache.get();
  return all
    .filter((r) => matchesSearch([r.title, r.type, r.siteName], filters.search))
    .slice(0, MAX_REPORT_CARDS);
}

export async function testSsl(): Promise<{ ok: boolean; message: string }> {
  // GET /ssl_test → { status: true, message: "...", name: "..." }
  const { data } = await apiClient.get<{ status: boolean; message: string }>('/ssl_test');
  return { ok: data.status === true, message: data.message };
}
