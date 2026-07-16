import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Centralized query keys avoid typos and make cache invalidation predictable.
export const queryKeys = {
  employees: (filters: unknown) => ['employees', filters] as const,
  employee: (id: unknown) => ['employees', 'detail', id] as const,
  sites: (search?: string) => ['sites', search] as const,
  siteEmployees: (siteId: unknown) => ['sites', siteId, 'employees'] as const,
  siteRoles: (siteId: unknown) => ['sites', siteId, 'roles'] as const,
  designations: () => ['designations'] as const,
  attendance: (filters: unknown) => ['attendance', filters] as const,
  attendanceDetail: (id: unknown) => ['attendance', 'detail', id] as const,
  monthlySummary: () => ['attendance', 'monthly-summary'] as const,
  leaves: (filters: unknown) => ['leaves', filters] as const,
  leaveDetail: (id: unknown) => ['leaves', 'detail', id] as const,
  schedules: (filters: unknown) => ['schedules', filters] as const,
  scheduleDetail: (id: unknown) => ['schedules', 'detail', id] as const,
  blockedDates: (siteId: unknown) => ['schedules', 'blocked-dates', siteId] as const,
  shifts: () => ['shifts'] as const,
  roles: () => ['roles'] as const,
  rolesDropdown: () => ['roles', 'dropdown'] as const,
  modules: () => ['modules'] as const,
  reports: (filters: unknown) => ['reports', filters] as const,
  health: () => ['settings', 'health'] as const,
  sslTest: () => ['settings', 'ssl-test'] as const,
};
