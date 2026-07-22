import { apiClient } from './client';
import type { Shift } from '@/types';

interface ShiftRow {
  id: string;
  shift_name: string;
  shift_type: string;
  shift_type_name: string;
  shift_start: string;
  shift_end: string;
  shift_duration: string;
  last_updated: string | null;
}

export async function listShifts(): Promise<Shift[]> {
  // GET /shift_list → { shift_info: [...] }
  const { data } = await apiClient.get<{ shift_info: ShiftRow[] }>('/shift_list');
  return (data.shift_info ?? []).map((s) => ({
    id: s.id,
    name: s.shift_name,
    startTime: s.shift_start,
    endTime: s.shift_end,
  }));
}

export interface AddShiftPayload {
  name: string;
  startTime: string;
  endTime: string;
}

// TODO: the exact `add_shift` payload field names are not yet confirmed with
// the backend controller — verify before relying on this in production.
export async function addShift(payload: AddShiftPayload): Promise<Shift> {
  const { data } = await apiClient.post<Shift>('/add_shift', payload);
  return data;
}

// NOTE: No documented update endpoint exists for shifts. The edit action in
// the UI is shown as a disabled placeholder until the backend team confirms
// an `update_shift`-style route.
