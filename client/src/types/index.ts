// Domain models for the NHA ETTM HRIS.
// Fields are optional-by-default until each production response shape is
// confirmed with the backend team — see README "Undocumented API TODO list".

export type ID = string | number;

export interface User {
  id: ID;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  designation?: string;
  siteId?: ID;
  siteName?: string;
  avatarUrl?: string;
}

export interface Employee {
  id: ID;
  name?: string;
  employeeCode?: string;
  designation?: string;
  siteId?: ID;
  siteName?: string;
  roleId?: ID;
  roleName?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'suspended';
  joiningDate?: string;
  avatarUrl?: string;
}

export interface Site {
  id: ID;
  name?: string;
  code?: string;
  location?: string;
  employeeCount?: number;
  status?: 'active' | 'inactive';
}

export interface Designation {
  id: ID;
  title?: string;
  department?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave' | 'half-day';

export interface AttendanceRecord {
  id: ID;
  employeeId?: ID;
  employeeName?: string;
  siteId?: ID;
  siteName?: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  source?: 'mobile' | 'terminal' | 'manual';
}

export type LeaveStatus = 'pending' | 'approved' | 'disapproved';

export interface Leave {
  id: ID;
  employeeId?: ID;
  employeeName?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  status?: LeaveStatus;
  reason?: string;
  rejectionReason?: string;
  appliedOn?: string;
}

export interface Schedule {
  id: ID;
  siteId?: ID;
  siteName?: string;
  employeeId?: ID;
  employeeName?: string;
  shiftId?: ID;
  shiftName?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'blocked' | 'completed';
}

export interface Shift {
  id: ID;
  name?: string;
  startTime?: string;
  endTime?: string;
  status?: 'active' | 'inactive';
}

export interface Module {
  id: ID;
  name?: string;
}

export interface Permission {
  write: boolean;
  edit: boolean;
  approve: boolean;
  delete: boolean;
}

export interface Role {
  id: ID;
  name?: string;
  description?: string;
  employees?: Pick<Employee, 'id' | 'name'>[];
  modules?: Module[];
  sites?: Pick<Site, 'id' | 'name'>[];
  permissions?: Permission;
}

export interface Report {
  id: ID;
  title?: string;
  type?: string;
  generatedOn?: string;
  siteName?: string;
  dateRange?: string;
}

export interface MonthlySummary {
  month?: string;
  totalEmployees?: number;
  present?: number;
  absent?: number;
  onLeave?: number;
  late?: number;
  attendanceRate?: number;
}

export type ApiError = {
  status?: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
