import { apiClient, createListCache, matchesSearch, paginateList } from './client';
import { scopeByEmployee } from '@/lib/access';
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
  // Only leaves belonging to employees this user is responsible for.
  const all = scopeByEmployee(await leavesCache.get(), (l) => l.employeeId);
  const filtered = all.filter(
    (l) =>
      matchesSearch([l.employeeName, l.leaveType], filters.search) &&
      (!filters.status || l.status === filters.status),
  );
  return paginateList(filtered, filters.page, filters.pageSize);
}

export async function getLeaveDetail(id: Leave['id']): Promise<Leave | undefined> {
  const all = scopeByEmployee(await leavesCache.get(), (l) => l.employeeId);
  return all.find((l) => String(l.id) === String(id));
}

export interface AddLeavePayload {
  employeeId: string | number; // biometric id (bio_id)
  leaveType: string; // numeric leave-type id as a string (1=Short, 2=Casual, 3=Sick)
  startDate: string;
  endDate: string;
  reason: string;
}

export interface AddLeaveResult {
  msg?: string;
  status?: string;
}

// Field names match the CodeIgniter Api/Forms/AddLeave controller. Dates use
// the picker's "YYYY-MM-DD" (the controller runs them through strtotime, which
// accepts that). The employee is identified by bio_id via `user_bio_id`.
export async function addLeave(payload: AddLeavePayload): Promise<AddLeaveResult> {
  const body = {
    start_date: String(payload.startDate),
    end_date: String(payload.endDate),
    leave_type: String(payload.leaveType),
    leave_reason: payload.reason,
    user_bio_id: String(payload.employeeId),
  };
  const { data } = await apiClient.post<AddLeaveResult>('/add_leave', body);
  leavesCache.clear();
  return data;
}

// NOTE: update_leave/delete_leave/approve/disapprove controllers have not been
// reviewed yet — their payload field names still need to be confirmed.

// The UpdateLeave controller has not been reviewed yet, so its field names are
// still unconfirmed. It is sent leave_id for consistency with the other
// leave endpoints.
export async function updateLeave(id: Leave['id'], payload: Partial<AddLeavePayload>): Promise<Leave | undefined> {
  const { data } = await apiClient.post<Leave>('/update_leave', { leave_id: String(id), ...payload });
  leavesCache.clear();
  return data;
}

export async function deleteLeave(id: Leave['id']): Promise<void> {
  await apiClient.post('/delete_leave', { leave_id: String(id) });
  leavesCache.clear();
}

// Api/ApproveLeave reads only `leave_id`; it recalculates the affected
// schedule's leave totals server-side.
export async function approveLeave(id: Leave['id']): Promise<AddLeaveResult> {
  const { data } = await apiClient.post<AddLeaveResult>('/approve_leave', { leave_id: String(id) });
  leavesCache.clear();
  return data;
}

/*
 * Api/DisapproveLeave also reads only `leave_id` — it accepts no rejection
 * reason, so none is sent (the UI does not ask for one).
 */
export async function disapproveLeave(id: Leave['id']): Promise<AddLeaveResult> {
  const { data } = await apiClient.post<AddLeaveResult>('/disapprove_leave', { leave_id: String(id) });
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
