import { apiClient, USE_MOCK_API } from './client';
import { delay, generateId, mockDb, paginate, searchFilter } from './mock/handlers';
import type { PaginatedResult, Schedule } from '@/types';

export interface ScheduleFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  siteId?: string | number;
}

export async function listSchedules(filters: ScheduleFilters): Promise<PaginatedResult<Schedule>> {
  if (USE_MOCK_API) {
    let items = [...mockDb.schedules];
    items = searchFilter(items, filters.search, ['employeeName', 'siteName', 'shiftName']);
    if (filters.siteId) items = items.filter((s) => String(s.siteId) === String(filters.siteId));
    items.sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
    return delay(paginate(items, filters));
  }
  const { data } = await apiClient.get<PaginatedResult<Schedule>>('/schedule_list', { params: filters });
  return data;
}

export async function getScheduleDetail(id: Schedule['id']): Promise<Schedule | undefined> {
  if (USE_MOCK_API) {
    return delay(mockDb.schedules.find((s) => String(s.id) === String(id)));
  }
  const { data } = await apiClient.get<Schedule>(`/schedule_detail/${id}`);
  return data;
}

export interface AddSchedulePayload {
  siteId: string | number;
  employeeId: string | number;
  shiftId: string | number;
  startDate: string;
  endDate: string;
}

export async function addSchedule(payload: AddSchedulePayload): Promise<Schedule> {
  if (USE_MOCK_API) {
    const site = mockDb.sites.find((s) => String(s.id) === String(payload.siteId));
    const employee = mockDb.employees.find((e) => String(e.id) === String(payload.employeeId));
    const shift = mockDb.shifts.find((s) => String(s.id) === String(payload.shiftId));
    const schedule: Schedule = {
      id: generateId(),
      siteId: payload.siteId,
      siteName: site?.name,
      employeeId: payload.employeeId,
      employeeName: employee?.name,
      shiftId: payload.shiftId,
      shiftName: shift?.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'active',
    };
    mockDb.schedules.unshift(schedule);
    return delay(schedule, 400);
  }
  const { data } = await apiClient.post<Schedule>('/add_schedule', payload);
  return data;
}

export async function getBlockedDates(siteId: string | number): Promise<string[]> {
  if (USE_MOCK_API) {
    return delay(
      mockDb.schedules
        .filter((s) => String(s.siteId) === String(siteId) && s.status === 'blocked')
        .map((s) => s.startDate ?? '')
        .filter(Boolean),
    );
  }
  const { data } = await apiClient.get<string[]>('/start_schedule_blocked_dates', { params: { siteId } });
  return data;
}
