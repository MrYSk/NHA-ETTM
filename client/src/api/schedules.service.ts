import { apiClient, createListCache, matchesSearch, paginateList } from './client';
import { scopeByEmployee } from '@/lib/access';
import type { PaginatedResult, Schedule } from '@/types';

export interface ScheduleFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  siteId?: string | number;
}

// Real row shape of `schedule_list` (verified against the live API).
interface ScheduleRow {
  id: string;
  bio_id: string;
  fullname: string;
  site: string;
  site_name: string;
  designation: string;
  designation_name: string;
  schedule_start: string;
  schedule_end: string;
  total_schedule_days: string;
  shift_id: string;
  shift_name: string;
  shift_type: string;
  shift_duration: string;
  shift_start: string;
  shift_end: string;
  last_updated: string | null;
}

function mapSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    siteId: row.site,
    siteName: row.site_name,
    employeeId: row.bio_id,
    employeeName: row.fullname,
    shiftId: row.shift_id,
    shiftName: row.shift_name,
    startDate: row.schedule_start,
    endDate: row.schedule_end,
  };
}

// POST /schedule_list returns every schedule (the upstream ignores
// pagination), wrapped as { schedule_rows, total_rows }.
const schedulesCache = createListCache(async () => {
  const { data } = await apiClient.post<{ schedule_rows: ScheduleRow[] }>('/schedule_list', {});
  return (data.schedule_rows ?? []).map(mapSchedule);
});

export async function listSchedules(filters: ScheduleFilters): Promise<PaginatedResult<Schedule>> {
  const all = scopeByEmployee(await schedulesCache.get(), (s) => s.employeeId);
  const filtered = all.filter(
    (s) =>
      matchesSearch([s.employeeName, s.siteName, s.shiftName], filters.search) &&
      (!filters.siteId || String(s.siteId) === String(filters.siteId)),
  );
  return paginateList(filtered, filters.page, filters.pageSize);
}

export async function getScheduleDetail(id: Schedule['id']): Promise<Schedule | undefined> {
  const all = scopeByEmployee(await schedulesCache.get(), (s) => s.employeeId);
  return all.find((s) => String(s.id) === String(id));
}

export interface AddSchedulePayload {
  siteId: string | number;
  employeeId: string | number;
  shiftId: string | number;
  startDate: string;
  endDate: string;
}

export interface AddScheduleResult {
  msg?: string;
  status?: string;
}

// The <input type="date"> value is "YYYY-MM-DD", but the AddSchedule controller
// parses dates as "MM/DD/YYYY" (Api/AddSchedule/index.php).
function toControllerDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${month}/${day}/${year}`;
}

// Payload shaped to match the CodeIgniter Api/AddSchedule controller exactly:
// - from_date/to_date in MM/DD/YYYY
// - selected_users: an array of biometric ids (the controller inserts bio_id)
// - shift_id, plus public-holiday count/reason (no public holidays by default)
// The controller ignores `site`, so it is not sent.
export async function addSchedule(payload: AddSchedulePayload): Promise<AddScheduleResult> {
  const bioId = String(payload.employeeId);
  const body = {
    from_date: toControllerDate(String(payload.startDate)),
    to_date: toControllerDate(String(payload.endDate)),
    selected_users: [bioId],
    user_id: bioId,
    shift_id: String(payload.shiftId),
    p_h_c: 0,
    p_h_r: '',
  };
  const { data } = await apiClient.post<AddScheduleResult>('/add_schedule', body);
  schedulesCache.clear();
  return data;
}

export async function getBlockedDates(siteId: string | number): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/start_schedule_blocked_dates', { params: { siteId } });
  return data;
}
