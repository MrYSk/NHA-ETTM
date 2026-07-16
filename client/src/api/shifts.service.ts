import { apiClient, USE_MOCK_API } from './client';
import { delay, generateId, mockDb } from './mock/handlers';
import type { Shift } from '@/types';

export async function listShifts(): Promise<Shift[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.shifts);
  }
  const { data } = await apiClient.get<Shift[]>('/shift_list');
  return data;
}

export interface AddShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
}

export async function addShift(payload: AddShiftPayload): Promise<Shift> {
  if (USE_MOCK_API) {
    const shift: Shift = { id: generateId(), ...payload, status: 'active' };
    mockDb.shifts.unshift(shift);
    return delay(shift, 350);
  }
  const { data } = await apiClient.post<Shift>('/add_shift', payload);
  return data;
}

// NOTE: No documented update endpoint exists for shifts. The edit action in
// the UI is shown as a disabled placeholder until the backend team confirms
// an `update_shift`-style route.
