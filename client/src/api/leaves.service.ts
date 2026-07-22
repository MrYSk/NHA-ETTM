import { apiClient, createListCache, matchesSearch, paginateList } from './client';
import type { Leave, LeaveStatus, PaginatedResult } from '@/types';

export interface LeaveFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeaveStatus;
}

/*
 * Real row shape of `leaves_list` (verified against the live API).
 * status codes: 0 = unknown, 1 = approved, 2 = pending — the readable label
 * is authoritative.
 */
interface LeaveRow {
  id: string;
  bio_id: string;
  full_name: string;
  leave_type: string;
  leave_type_readable: string;
  leave_status_readable: string;
  start_date: string;
  end_date: string;
  add_date: string;
  reason: string;
  status: string;
  disapprove_reason: string | null;
}

function mapLeaveStatus(readable: string): LeaveStatus | undefined {
  const key = readable?.toLowerCase();
  if (key === 'pending' || key === 'approved' || key === 'disapproved') return key;
  return undefined;
}

function mapLeave(row: LeaveRow): Leave {
  return {
    id: row.id,
    employeeId: row.bio_id,
    employeeName: row.full_name,
    leaveType: row.leave_type_readable,
    startDate: row.start_date,
    endDate: row.end_date,
    status: mapLeaveStatus(row.leave_status_readable),
    reason: row.reason,
    rejectionReason: row.disapprove_reason ?? undefined,
    appliedOn: row.add_date,
  };
}

// POST /leaves_list returns every leave (the upstream ignores pagination),
// wrapped as { leave_rows, total_rows }.
const leavesCache = createListCache(async () => {
  const { data } = await apiClient.post<{ leave_rows: LeaveRow[] }>('/leaves_list', {});
  return (data.leave_rows ?? []).map(mapLeave);
});

export async function listLeaves(filters: LeaveFilters): Promise<PaginatedResult<Leave>> {
  const all = await leavesCache.get();
  const filtered = all.filter(
    (l) =>
      matchesSearch([l.employeeName, l.leaveType], filters.search) &&
      (!filters.status || l.status === filters.status),
  );
  return paginateList(filtered, filters.page, filters.pageSize);
}

export async function getLeaveDetail(id: Leave['id']): Promise<Leave | undefined> {
  const all = await leavesCache.get();
  return all.find((l) => String(l.id) === String(id));
}

export interface AddLeavePayload {
  employeeId: string | number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

// TODO: the exact payload field names of the leave mutation endpoints below
// are not yet confirmed with the backend controllers — verify before relying
// on them in production.
export async function addLeave(payload: AddLeavePayload): Promise<Leave> {
  const { data } = await apiClient.post<Leave>('/add_leave', payload);
  leavesCache.clear();
  return data;
}

export async function updateLeave(id: Leave['id'], payload: Partial<AddLeavePayload>): Promise<Leave | undefined> {
  const { data } = await apiClient.post<Leave>('/update_leave', { id, ...payload });
  leavesCache.clear();
  return data;
}

export async function deleteLeave(id: Leave['id']): Promise<void> {
  await apiClient.post('/delete_leave', { id });
  leavesCache.clear();
}

export async function approveLeave(id: Leave['id']): Promise<Leave | undefined> {
  const { data } = await apiClient.post<Leave>('/approve_leave', { id });
  leavesCache.clear();
  return data;
}

export async function disapproveLeave(id: Leave['id'], rejectionReason: string): Promise<Leave | undefined> {
  const { data } = await apiClient.post<Leave>('/disapprove_leave', { id, rejectionReason });
  leavesCache.clear();
  return data;
}

export async function checkLeaveStartDate(date: string): Promise<{ available: boolean }> {
  const { data } = await apiClient.get('/check_leave_start_date', { params: { date } });
  return data;
}

export async function checkLeaveEndDate(date: string): Promise<{ available: boolean }> {
  const { data } = await apiClient.get('/check_leave_end_date', { params: { date } });
  return data;
}
