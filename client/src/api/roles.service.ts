import { apiClient } from './client';
import type { Permission, Role } from '@/types';

/*
 * Real row shape of `roles_list` / `roles_list_dropdown` (verified against
 * the live API). `modules` is only present on `roles_list`; pivot rows may
 * also carry employees/sites depending on role configuration.
 */
interface RoleRow {
  id: string;
  name: string;
  read_permission: string;
  write_permission: string;
  edit_permission: string;
  approval_permission: string;
  delete_permission: string;
  /*
   * Pivot rows. NOTE: in each of these the `id`/`name` pair is the ROLE's own
   * id and name — the linked record is in the prefixed fields (`emp_id`,
   * `module_id`, `site_id`). `emp_id` is a biometric id.
   */
  modules?: { id: string; name: string; module_id: string; module_name: string }[];
  employees?: { id: string; name?: string; emp_id?: string; employee_name?: string }[];
  sites?: { id: string; name?: string; site_id?: string; site_name?: string }[];
}

function mapRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name,
    permissions: {
      write: row.write_permission === '1',
      edit: row.edit_permission === '1',
      approve: row.approval_permission === '1',
      delete: row.delete_permission === '1',
    },
    modules: (row.modules ?? []).map((m) => ({ id: m.module_id, name: m.module_name })),
    employees: (row.employees ?? []).map((e) => ({
      id: e.emp_id ?? '',
      name: e.employee_name,
    })),
    sites: (row.sites ?? []).map((s) => ({ id: s.site_id ?? '', name: s.site_name })),
  };
}

export async function listRoles(): Promise<Role[]> {
  // GET /roles_list → { role_info: [...] }
  const { data } = await apiClient.get<{ role_info: RoleRow[] }>('/roles_list');
  return (data.role_info ?? []).map(mapRole);
}

export async function listRolesForDropdown(): Promise<Pick<Role, 'id' | 'name'>[]> {
  // GET /roles_list_dropdown → { roles_dropdown_info: [...] }
  const { data } = await apiClient.get<{ roles_dropdown_info: RoleRow[] }>('/roles_list_dropdown');
  return (data.roles_dropdown_info ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export interface AddRolePayload {
  name: string;
  /** Biometric ids of the employees the role applies to. */
  employeeIds: string[];
  /** Module ids the role grants access to. */
  moduleIds: string[];
  /** Site ids the role covers. */
  siteIds: string[];
}

export interface AddRoleResult {
  msg?: string;
  status?: string;
}

/*
 * Field names match the Api/Forms/AddRole controller, which reads exactly
 * `role_name`, `employees`, `modules` and `sites` (it stores no description).
 * Employees are identified by biometric id, matching the role pivot's emp_id.
 */
export async function addRole(payload: AddRolePayload): Promise<AddRoleResult> {
  const { data } = await apiClient.post<AddRoleResult>('/add_role', {
    role_name: payload.name,
    employees: payload.employeeIds,
    modules: payload.moduleIds,
    sites: payload.siteIds,
  });
  return data;
}

// TODO: the payload field names of the permission toggles, pivot deletes and
// `update_employee_role` are still unconfirmed with their controllers.

export async function togglePermission(
  roleId: Role['id'],
  permission: keyof Permission,
  value: boolean,
): Promise<void> {
  const endpoints: Record<keyof Permission, string> = {
    write: '/toggle_write_permission',
    edit: '/toggle_edit_permission',
    approve: '/toggle_approve_permission',
    delete: '/toggle_delete_permission',
  };
  await apiClient.post(endpoints[permission], { roleId, value });
}

export async function removeEmployeeFromRole(roleId: Role['id'], employeeId: string | number): Promise<void> {
  await apiClient.post('/delete_employee_from_pivot', { roleId, employeeId });
}

export async function removeModuleFromRole(roleId: Role['id'], moduleId: string | number): Promise<void> {
  await apiClient.post('/delete_module_from_pivot', { roleId, moduleId });
}

export async function removeSiteFromRole(roleId: Role['id'], siteId: string | number): Promise<void> {
  await apiClient.post('/delete_site_from_pivot', { roleId, siteId });
}

export async function updateEmployeeRole(employeeId: string | number, roleId: string | number): Promise<void> {
  await apiClient.post('/update_employee_role', { employeeId, roleId });
}

export async function listModules(): Promise<{ id: string | number; name: string }[]> {
  // GET /modules_list → { module_info: [{id, name, status}] }
  const { data } = await apiClient.get<{ module_info: { id: string; name: string; status: string }[] }>(
    '/modules_list',
  );
  return (data.module_info ?? []).map((m) => ({ id: m.id, name: m.name }));
}
