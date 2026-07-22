import { apiClient, createListCache, matchesSearch, paginateList } from './client';
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
  const all = await schedulesCache.get();
  const filtered = all.filter(
    (s) =>
      matchesSearch([s.employeeName, s.siteName, s.shiftName], filters.search) &&
      (!filters.siteId || String(s.siteId) === String(filters.siteId)),
  );
  return paginateList(filtered, filters.page, filters.pageSize);
}

export async function getScheduleDetail(id: Schedule['id']): Promise<Schedule | undefined> {
  const all = await schedulesCache.get();
  return all.find((s) => String(s.id) === String(id));
}

export interface AddSchedulePayload {
  siteId: string | number;
  employeeId: string | number;
  shiftId: string | number;
  startDate: string;
  endDate: string;
}

// TODO: the exact payload field names of `add_schedule` and
// `start_schedule_blocked_dates` are not yet confirmed with the backend
// controllers — verify before relying on them in production.
export async function addSchedule(payload: AddSchedulePayload): Promise<Schedule> {
  const { data } = await apiClient.post<Schedule>('/add_schedule', payload);
  schedulesCache.clear();
  return data;
}

export async function getBlockedDates(siteId: string | number): Promise<string[]> {
  const { data } = await apiClient.get<string[]>('/start_schedule_blocked_dates', { params: { siteId } });
  return data;
}
