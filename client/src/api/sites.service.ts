import { apiClient, createListCache, matchesSearch } from './client';
import { listAllEmployees, mapEmployee, type EmployeeRow } from './employees.service';
import type { Designation, Employee, Role, Site } from '@/types';

interface DesignationRow {
  id: string;
  designation_name: string;
  designation_description: string;
  last_updated: string | null;
}

// POST /sites_list → { sites_info: [{id, name}] } (verified against the live
// API — no code/location/status fields exist upstream).
const sitesCache = createListCache(async () => {
  const { data } = await apiClient.post<{ sites_info: Pick<Site, 'id' | 'name'>[] }>('/sites_list', {});
  return data.sites_info ?? [];
});

export async function listSites(search?: string): Promise<Site[]> {
  const [sites, employees] = await Promise.all([sitesCache.get(), listAllEmployees()]);

  const countBySite = new Map<string, number>();
  for (const employee of employees) {
    const key = String(employee.siteId);
    countBySite.set(key, (countBySite.get(key) ?? 0) + 1);
  }

  return sites
    .filter((s) => matchesSearch([s.name], search))
    .map((s) => ({ ...s, employeeCount: countBySite.get(String(s.id)) ?? 0 }));
}

export async function listDesignations(): Promise<Designation[]> {
  // GET /designations_list → { designations_info: [...] }
  const { data } = await apiClient.get<{ designations_info: DesignationRow[] }>('/designations_list');
  return (data.designations_info ?? []).map((d) => ({
    id: d.id,
    title: d.designation_name,
    department: d.designation_description,
  }));
}

export async function getSiteEmployees(siteId: Site['id']): Promise<Employee[]> {
  const { data } = await apiClient.get<{ user_info?: EmployeeRow[]; employees_info?: EmployeeRow[] }>(
    `/site_employees/${siteId}`,
  );
  return (data.user_info ?? data.employees_info ?? []).map(mapEmployee);
}

export async function getSiteRoles(siteId: Site['id']): Promise<Role[]> {
  const { data } = await apiClient.get<{ role_info?: Role[]; roles_info?: Role[] }>(`/site_roles/${siteId}`);
  return data.role_info ?? data.roles_info ?? [];
}
