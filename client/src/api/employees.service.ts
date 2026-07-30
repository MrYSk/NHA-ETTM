import { apiClient, createListCache, matchesSearch, paginateList } from './client';
import { scopeByEmployee } from '@/lib/access';
import type { Employee, PaginatedResult } from '@/types';

export interface EmployeeFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  siteId?: string | number;
  designation?: string | number;
  roleId?: string | number;
}

/*
 * Real row shape of `user_list` / `employees_list_for_filters`
 * (verified against the live API).
 */
export interface EmployeeRow {
  id: string;
  fullname: string;
  email: string;
  bio_ref_id: string;
  site: string;
  site_name: string;
  contact: string;
  address: string;
  employee_type: string;
  type_of_employee: string;
  consultant: string;
  section: string;
  section_name: string;
  field: string;
  field_name: string;
  designation: string;
  designation_name: string;
  role: string;
  role_name: string;
  status: string;
}

export function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    // bio_ref_id is the biometric id the attendance/schedule/leave systems key on.
    bioId: row.bio_ref_id,
    name: row.fullname,
    employeeCode: row.bio_ref_id,
    designation: row.designation_name,
    siteId: row.site,
    siteName: row.site_name,
    roleId: row.role,
    roleName: row.role_name,
    phone: row.contact,
    email: row.email,
    status: row.status === '1' ? 'active' : 'inactive',
  };
}

/*
 * POST /user_list returns every employee (the upstream ignores pagination),
 * wrapped as { employees_rows, total_rows }. Send no filter objects: empty
 * `{items: []}` arrays crash the upstream SQL (`IN ()`), so all filtering is
 * done client-side instead.
 */
const employeesCache = createListCache(async () => {
  const { data } = await apiClient.post<{ employees_rows: EmployeeRow[] }>('/user_list', {});
  return (data.employees_rows ?? []).map(mapEmployee);
});

export async function listEmployees(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
  const all = await listAllEmployees();
  const filtered = all.filter(
    (e) =>
      matchesSearch([e.name, e.employeeCode, e.email], filters.search) &&
      (!filters.siteId || String(e.siteId) === String(filters.siteId)) &&
      (!filters.designation || e.designation === String(filters.designation)) &&
      (!filters.roleId || String(e.roleId) === String(filters.roleId)),
  );
  return paginateList(filtered, filters.page, filters.pageSize);
}

// Narrowed to the employees the signed-in user is responsible for.
export async function listAllEmployees(): Promise<Employee[]> {
  const all = await employeesCache.get();
  return scopeByEmployee(all, (e) => e.bioId);
}

/** The full, unscoped roster — only for pickers that must offer everyone. */
export async function listEveryEmployee(): Promise<Employee[]> {
  return employeesCache.get();
}

export async function getEmployee(id: Employee['id']): Promise<Employee | undefined> {
  const all = await listAllEmployees();
  return all.find((e) => String(e.id) === String(id));
}

export interface AddEmployeePayload {
  name: string;
  employeeCode: string;
  designation: string;
  siteId: string | number;
  phone?: string;
  email?: string;
}

// TODO: the exact `add_user` payload field names are not yet confirmed with
// the backend controller — verify before relying on this in production.
export async function addEmployee(payload: AddEmployeePayload): Promise<Employee> {
  const { data } = await apiClient.post<Employee>('/add_user', payload);
  employeesCache.clear();
  return data;
}
