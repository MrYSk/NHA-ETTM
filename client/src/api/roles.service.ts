import { apiClient, USE_MOCK_API } from './client';
import { delay, generateId, mockDb } from './mock/handlers';
import type { Permission, Role } from '@/types';

export async function listRoles(): Promise<Role[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.roles);
  }
  const { data } = await apiClient.get<Role[]>('/roles_list');
  return data;
}

export async function listRolesForDropdown(): Promise<Pick<Role, 'id' | 'name'>[]> {
  if (USE_MOCK_API) {
    return delay(mockDb.roles.map((r) => ({ id: r.id, name: r.name })));
  }
  const { data } = await apiClient.get<Pick<Role, 'id' | 'name'>[]>('/roles_list_dropdown');
  return data;
}

export interface AddRolePayload {
  name: string;
  description?: string;
}

export async function addRole(payload: AddRolePayload): Promise<Role> {
  if (USE_MOCK_API) {
    const role: Role = {
      id: generateId(),
      name: payload.name,
      description: payload.description,
      employees: [],
      modules: [],
      sites: [],
      permissions: { write: false, edit: false, approve: false, delete: false },
    };
    mockDb.roles.unshift(role);
    return delay(role, 400);
  }
  const { data } = await apiClient.post<Role>('/add_role', payload);
  return data;
}

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
  if (USE_MOCK_API) {
    const role = mockDb.roles.find((r) => String(r.id) === String(roleId));
    if (role?.permissions) role.permissions[permission] = value;
    return delay(undefined, 250);
  }
  await apiClient.post(endpoints[permission], { roleId, value });
}

export async function removeEmployeeFromRole(roleId: Role['id'], employeeId: string | number): Promise<void> {
  if (USE_MOCK_API) {
    const role = mockDb.roles.find((r) => String(r.id) === String(roleId));
    if (role?.employees) role.employees = role.employees.filter((e) => String(e.id) !== String(employeeId));
    return delay(undefined, 250);
  }
  await apiClient.post('/delete_employee_from_pivot', { roleId, employeeId });
}

export async function removeModuleFromRole(roleId: Role['id'], moduleId: string | number): Promise<void> {
  if (USE_MOCK_API) {
    const role = mockDb.roles.find((r) => String(r.id) === String(roleId));
    if (role?.modules) role.modules = role.modules.filter((m) => String(m.id) !== String(moduleId));
    return delay(undefined, 250);
  }
  await apiClient.post('/delete_module_from_pivot', { roleId, moduleId });
}

export async function removeSiteFromRole(roleId: Role['id'], siteId: string | number): Promise<void> {
  if (USE_MOCK_API) {
    const role = mockDb.roles.find((r) => String(r.id) === String(roleId));
    if (role?.sites) role.sites = role.sites.filter((s) => String(s.id) !== String(siteId));
    return delay(undefined, 250);
  }
  await apiClient.post('/delete_site_from_pivot', { roleId, siteId });
}

export async function updateEmployeeRole(employeeId: string | number, roleId: string | number): Promise<void> {
  if (USE_MOCK_API) {
    const employee = mockDb.employees.find((e) => String(e.id) === String(employeeId));
    const role = mockDb.roles.find((r) => String(r.id) === String(roleId));
    if (employee) {
      employee.roleId = roleId;
      employee.roleName = role?.name;
    }
    return delay(undefined, 300);
  }
  await apiClient.post('/update_employee_role', { employeeId, roleId });
}

// TODO: Confirm HTTP method, headers, and request payload with the backend
// team for `modules_list`, `employees_list_for_roles_form`, and
// `sites_list_for_roles_form` — used to populate the "Add role" form pickers.
export async function listModules(): Promise<{ id: string | number; name: string }[]> {
  if (USE_MOCK_API) {
    return delay([
      { id: 1, name: 'Attendance' },
      { id: 2, name: 'Mobile App' },
      { id: 3, name: 'Schedules' },
      { id: 4, name: 'Leaves' },
      { id: 5, name: 'Employees' },
      { id: 6, name: 'Reports' },
      { id: 7, name: 'Roles' },
    ]);
  }
  const { data } = await apiClient.get('/modules_list');
  return data;
}
