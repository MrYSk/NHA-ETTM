import { apiClient, USE_MOCK_API } from './client';
import { delay, generateId, mockDb, paginate, searchFilter } from './mock/handlers';
import type { Employee, PaginatedResult } from '@/types';

export interface EmployeeFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  siteId?: string | number;
  designation?: string;
  roleId?: string | number;
}

export async function listEmployees(filters: EmployeeFilters): Promise<PaginatedResult<Employee>> {
  if (USE_MOCK_API) {
    let items = [...mockDb.employees];
    items = searchFilter(items, filters.search, ['name', 'employeeCode', 'email']);
    if (filters.siteId) items = items.filter((e) => String(e.siteId) === String(filters.siteId));
    if (filters.designation) items = items.filter((e) => e.designation === filters.designation);
    if (filters.roleId) items = items.filter((e) => String(e.roleId) === String(filters.roleId));
    return delay(paginate(items, filters));
  }
  const { data } = await apiClient.get<PaginatedResult<Employee>>('/user_list', { params: filters });
  return data;
}

export async function getEmployee(id: Employee['id']): Promise<Employee | undefined> {
  if (USE_MOCK_API) {
    return delay(mockDb.employees.find((e) => String(e.id) === String(id)));
  }
  const { data } = await apiClient.get<Employee>(`/employees_list_for_filters/${id}`);
  return data;
}

export interface AddEmployeePayload {
  name: string;
  employeeCode: string;
  designation: string;
  siteId: string | number;
  phone?: string;
  email?: string;
}

export async function addEmployee(payload: AddEmployeePayload): Promise<Employee> {
  if (USE_MOCK_API) {
    const site = mockDb.sites.find((s) => String(s.id) === String(payload.siteId));
    const employee: Employee = {
      id: generateId(),
      name: payload.name,
      employeeCode: payload.employeeCode,
      designation: payload.designation,
      siteId: payload.siteId,
      siteName: site?.name,
      phone: payload.phone,
      email: payload.email,
      status: 'active',
      joiningDate: new Date().toISOString(),
    };
    mockDb.employees.unshift(employee);
    return delay(employee, 400);
  }
  const { data } = await apiClient.post<Employee>('/add_user', payload);
  return data;
}
