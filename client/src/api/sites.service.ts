import { apiClient, USE_MOCK_API } from './client';
import { delay, mockDb, searchFilter } from './mock/handlers';
import type { Designation, Employee, Role, Site } from '@/types';

export async function listSites(search?: string): Promise<Site[]> {
  if (USE_MOCK_API) {
    return delay(searchFilter(mockDb.sites, search, ['name', 'code', 'location']));
  }
  const { data } = await apiClient.get<Site[]>('/sites_list', { params: { search } });
  return data;
}

export async function listDesignations(): Promise<Designation[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.designations);
  }
  const { data } = await apiClient.get<Designation[]>('/designations_list');
  return data;
}

export async function getSiteEmployees(siteId: Site['id']): Promise<Employee[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.employees.filter((e) => String(e.siteId) === String(siteId)));
  }
  const { data } = await apiClient.get<Employee[]>(`/site_employees/${siteId}`);
  return data;
}

export async function getSiteRoles(siteId: Site['id']): Promise<Role[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.roles.filter((r) => r.sites?.some((s) => String(s.id) === String(siteId))));
  }
  const { data } = await apiClient.get<Role[]>(`/site_roles/${siteId}`);
  return data;
}
