import { apiClient, USE_MOCK_API } from './client';
import { delay, mockDb, paginate } from './mock/handlers';
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

export async function listAttendance(filters: AttendanceFilters): Promise<PaginatedResult<AttendanceRecord>> {
  if (USE_MOCK_API) {
    let items = [...mockDb.attendance];
    if (filters.employeeId) items = items.filter((a) => String(a.employeeId) === String(filters.employeeId));
    if (filters.siteId) items = items.filter((a) => String(a.siteId) === String(filters.siteId));
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.dateFrom) items = items.filter((a) => (a.date ?? '') >= filters.dateFrom!);
    if (filters.dateTo) items = items.filter((a) => (a.date ?? '') <= filters.dateTo!);
    items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    return delay(paginate(items, filters));
  }
  const { data } = await apiClient.get<PaginatedResult<AttendanceRecord>>('/attendance_list', { params: filters });
  return data;
}

export async function getAttendanceDetail(id: AttendanceRecord['id']): Promise<AttendanceRecord | undefined> {
  if (USE_MOCK_API) {
    return delay(mockDb.attendance.find((a) => String(a.id) === String(id)));
  }
  const { data } = await apiClient.get<AttendanceRecord>(`/attendance_detail/${id}`);
  return data;
}

export async function getMonthlySummary(): Promise<MonthlySummary[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.monthlySummary);
  }
  const { data } = await apiClient.get<MonthlySummary[]>('/monthly_summary');
  return data;
}

// TODO: Confirm HTTP method, headers, and request payload with the backend
// team for `mobile_attendance` — undocumented in the provided route list.
export async function listMobileAttendance(filters: AttendanceFilters): Promise<PaginatedResult<AttendanceRecord>> {
  if (USE_MOCK_API) {
    const items = mockDb.attendance.filter((a) => a.source === 'mobile');
    return delay(paginate(items, filters));
  }
  const { data } = await apiClient.get<PaginatedResult<AttendanceRecord>>('/mobile_attendance', { params: filters });
  return data;
}
