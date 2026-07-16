import { apiClient, USE_MOCK_API } from './client';
import { delay, generateId, mockDb, paginate, searchFilter } from './mock/handlers';
import type { Leave, LeaveStatus, PaginatedResult } from '@/types';

export interface LeaveFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: LeaveStatus;
}

export async function listLeaves(filters: LeaveFilters): Promise<PaginatedResult<Leave>> {
  if (USE_MOCK_API) {
    let items = [...mockDb.leaves];
    items = searchFilter(items, filters.search, ['employeeName', 'leaveType']);
    if (filters.status) items = items.filter((l) => l.status === filters.status);
    items.sort((a, b) => (b.appliedOn ?? '').localeCompare(a.appliedOn ?? ''));
    return delay(paginate(items, filters));
  }
  const { data } = await apiClient.get<PaginatedResult<Leave>>('/leaves_list', { params: filters });
  return data;
}

export async function getLeaveDetail(id: Leave['id']): Promise<Leave | undefined> {
  if (USE_MOCK_API) {
    return delay(mockDb.leaves.find((l) => String(l.id) === String(id)));
  }
  const { data } = await apiClient.get<Leave>(`/leave_detail/${id}`);
  return data;
}

export interface AddLeavePayload {
  employeeId: string | number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export async function addLeave(payload: AddLeavePayload): Promise<Leave> {
  if (USE_MOCK_API) {
    const employee = mockDb.employees.find((e) => String(e.id) === String(payload.employeeId));
    const leave: Leave = {
      id: generateId(),
      employeeId: payload.employeeId,
      employeeName: employee?.name,
      leaveType: payload.leaveType,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'pending',
      reason: payload.reason,
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    mockDb.leaves.unshift(leave);
    return delay(leave, 400);
  }
  const { data } = await apiClient.post<Leave>('/add_leave', payload);
  return data;
}

export async function updateLeave(id: Leave['id'], payload: Partial<AddLeavePayload>): Promise<Leave | undefined> {
  if (USE_MOCK_API) {
    const leave = mockDb.leaves.find((l) => String(l.id) === String(id));
    if (leave) Object.assign(leave, payload);
    return delay(leave, 300);
  }
  const { data } = await apiClient.post<Leave>('/update_leave', { id, ...payload });
  return data;
}

export async function deleteLeave(id: Leave['id']): Promise<void> {
  if (USE_MOCK_API) {
    mockDb.leaves = mockDb.leaves.filter((l) => String(l.id) !== String(id));
    return delay(undefined, 300);
  }
  await apiClient.post('/delete_leave', { id });
}

export async function approveLeave(id: Leave['id']): Promise<Leave | undefined> {
  if (USE_MOCK_API) {
    const leave = mockDb.leaves.find((l) => String(l.id) === String(id));
    if (leave) {
      leave.status = 'approved';
      leave.rejectionReason = undefined;
    }
    return delay(leave, 300);
  }
  const { data } = await apiClient.post<Leave>('/approve_leave', { id });
  return data;
}

export async function disapproveLeave(id: Leave['id'], rejectionReason: string): Promise<Leave | undefined> {
  if (USE_MOCK_API) {
    const leave = mockDb.leaves.find((l) => String(l.id) === String(id));
    if (leave) {
      leave.status = 'disapproved';
      leave.rejectionReason = rejectionReason;
    }
    return delay(leave, 300);
  }
  const { data } = await apiClient.post<Leave>('/disapprove_leave', { id, rejectionReason });
  return data;
}

export async function checkLeaveStartDate(date: string): Promise<{ available: boolean }> {
  if (USE_MOCK_API) return delay({ available: true }, 200);
  const { data } = await apiClient.get('/check_leave_start_date', { params: { date } });
  return data;
}

export async function checkLeaveEndDate(date: string): Promise<{ available: boolean }> {
  if (USE_MOCK_API) return delay({ available: true }, 200);
  const { data } = await apiClient.get('/check_leave_end_date', { params: { date } });
  return data;
}
