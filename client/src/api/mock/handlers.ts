import type { PaginatedResult, PaginationParams } from '@/types';
import {
  mockAttendance,
  mockDesignations,
  mockEmployees,
  mockLeaves,
  mockMonthlySummary,
  mockReports,
  mockRoles,
  mockSchedules,
  mockShifts,
  mockSites,
} from './data';

// Simulated network latency keeps skeleton loaders and Suspense boundaries
// visibly exercised in mock mode, matching how the real API will feel.
const LATENCY_MS = 260;

export function delay<T>(value: T, ms: number = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function paginate<T>(items: T[], params?: PaginationParams): PaginatedResult<T> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export function searchFilter<T>(
  items: T[],
  search: string | undefined,
  keys: (keyof T)[],
): T[] {
  if (!search?.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((item) =>
    keys.some((key) => String(item[key] ?? '').toLowerCase().includes(q)),
  );
}

// In-memory mutable clones so add/update/delete mutations in mock mode
// persist for the duration of the session without touching real data.
export const mockDb = {
  employees: [...mockEmployees],
  sites: [...mockSites],
  designations: [...mockDesignations],
  attendance: [...mockAttendance],
  leaves: [...mockLeaves],
  schedules: [...mockSchedules],
  shifts: [...mockShifts],
  roles: [...mockRoles],
  reports: [...mockReports],
  monthlySummary: [...mockMonthlySummary],
};

let nextId = 100000;
export function generateId(): number {
  nextId += 1;
  return nextId;
}
