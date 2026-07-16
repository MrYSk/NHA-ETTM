import type {
  AttendanceRecord,
  Designation,
  Employee,
  Leave,
  MonthlySummary,
  Report,
  Role,
  Schedule,
  Shift,
  Site,
} from '@/types';

// Deterministic, seed-friendly mock data so the dashboard is meaningful
// immediately after `npm install && npm run dev`, with no live API needed.

const SITE_NAMES = [
  'Islamabad Toll Plaza',
  'Lahore-Sialkot Motorway',
  'Peshawar Interchange',
  'Karachi Northern Bypass',
  'Multan Toll Plaza',
  'Hyderabad Toll Plaza',
  'Faisalabad Interchange',
  'Rawalpindi ETTM Hub',
];

export const mockSites: Site[] = SITE_NAMES.map((name, i) => ({
  id: i + 1,
  name,
  code: `NHA-${(i + 1).toString().padStart(3, '0')}`,
  location: name.split(' ')[0],
  employeeCount: 12 + ((i * 7) % 30),
  status: i === 5 ? 'inactive' : 'active',
}));

export const mockDesignations: Designation[] = [
  { id: 1, title: 'Toll Collector', department: 'Operations' },
  { id: 2, title: 'Shift Supervisor', department: 'Operations' },
  { id: 3, title: 'ETTM Technician', department: 'Technical' },
  { id: 4, title: 'Site Manager', department: 'Management' },
  { id: 5, title: 'HR Officer', department: 'Human Resources' },
  { id: 6, title: 'IT Support Engineer', department: 'Technical' },
  { id: 7, title: 'Finance Officer', department: 'Finance' },
  { id: 8, title: 'Security Guard', department: 'Security' },
];

const FIRST_NAMES = [
  'Ahmed', 'Bilal', 'Sana', 'Hina', 'Usman', 'Ayesha', 'Kamran', 'Farah',
  'Imran', 'Zainab', 'Tariq', 'Nadia', 'Waqas', 'Mehwish', 'Adnan', 'Sadia',
  'Faisal', 'Rabia', 'Junaid', 'Saima', 'Hassan', 'Iqra', 'Salman', 'Uzma',
];
const LAST_NAMES = [
  'Khan', 'Malik', 'Butt', 'Chaudhry', 'Raza', 'Sheikh', 'Iqbal', 'Ahmad',
  'Farooq', 'Hussain', 'Javed', 'Qureshi',
];

function seedName(i: number) {
  return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
}

const EMPLOYEE_COUNT = 86;

export const mockEmployees: Employee[] = Array.from({ length: EMPLOYEE_COUNT }, (_, i) => {
  const site = mockSites[i % mockSites.length];
  const designation = mockDesignations[i % mockDesignations.length];
  const statusRoll = i % 11;
  return {
    id: i + 1,
    name: seedName(i),
    employeeCode: `ETTM-${(1000 + i).toString()}`,
    designation: designation.title,
    siteId: site.id,
    siteName: site.name,
    roleId: (i % 4) + 1,
    roleName: ['Operator', 'Supervisor', 'Manager', 'Support'][i % 4],
    phone: `03${(10 + (i % 90)).toString()}-${(1000000 + i * 37).toString().slice(0, 7)}`,
    email: `${seedName(i).toLowerCase().replace(' ', '.')}@nha.gov.pk`,
    status: statusRoll === 0 ? 'inactive' : statusRoll === 1 ? 'suspended' : 'active',
    joiningDate: new Date(2018 + (i % 6), i % 12, (i % 27) + 1).toISOString(),
  };
});

const ATT_STATUSES: AttendanceRecord['status'][] = ['present', 'present', 'present', 'late', 'absent', 'leave', 'half-day'];

export const mockAttendance: AttendanceRecord[] = Array.from({ length: 220 }, (_, i) => {
  const emp = mockEmployees[i % mockEmployees.length];
  const daysAgo = i % 14;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const status = ATT_STATUSES[i % ATT_STATUSES.length];
  return {
    id: i + 1,
    employeeId: emp.id,
    employeeName: emp.name,
    siteId: emp.siteId,
    siteName: emp.siteName,
    date: date.toISOString().slice(0, 10),
    checkIn: status === 'absent' || status === 'leave' ? undefined : '08:0' + (i % 10),
    checkOut: status === 'absent' || status === 'leave' ? undefined : '17:0' + (i % 10),
    status,
    source: i % 3 === 0 ? 'mobile' : i % 3 === 1 ? 'terminal' : 'manual',
  };
});

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave'];
const LEAVE_STATUSES: Leave['status'][] = ['pending', 'approved', 'approved', 'disapproved', 'pending'];

export const mockLeaves: Leave[] = Array.from({ length: 34 }, (_, i) => {
  const emp = mockEmployees[(i * 3) % mockEmployees.length];
  const start = new Date();
  start.setDate(start.getDate() + (i % 10) - 5);
  const end = new Date(start);
  end.setDate(end.getDate() + 1 + (i % 4));
  const applied = new Date(start);
  applied.setDate(applied.getDate() - 3);
  return {
    id: i + 1,
    employeeId: emp.id,
    employeeName: emp.name,
    leaveType: LEAVE_TYPES[i % LEAVE_TYPES.length],
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    status: LEAVE_STATUSES[i % LEAVE_STATUSES.length],
    reason: 'Personal matters requiring time away from site.',
    rejectionReason: LEAVE_STATUSES[i % LEAVE_STATUSES.length] === 'disapproved' ? 'Insufficient staffing coverage on requested dates.' : undefined,
    appliedOn: applied.toISOString().slice(0, 10),
  };
});

export const mockShifts: Shift[] = [
  { id: 1, name: 'Morning Shift', startTime: '06:00', endTime: '14:00', status: 'active' },
  { id: 2, name: 'Evening Shift', startTime: '14:00', endTime: '22:00', status: 'active' },
  { id: 3, name: 'Night Shift', startTime: '22:00', endTime: '06:00', status: 'active' },
  { id: 4, name: 'Weekend Shift', startTime: '08:00', endTime: '20:00', status: 'inactive' },
];

export const mockSchedules: Schedule[] = Array.from({ length: 40 }, (_, i) => {
  const emp = mockEmployees[(i * 5) % mockEmployees.length];
  const site = mockSites[i % mockSites.length];
  const shift = mockShifts[i % mockShifts.length];
  const start = new Date();
  start.setDate(start.getDate() + (i % 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    id: i + 1,
    siteId: site.id,
    siteName: site.name,
    employeeId: emp.id,
    employeeName: emp.name,
    shiftId: shift.id,
    shiftName: shift.name,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    status: i % 9 === 0 ? 'blocked' : i % 5 === 0 ? 'completed' : 'active',
  };
});

export const mockRoles: Role[] = [
  {
    id: 1,
    name: 'Site Operator',
    description: 'Front-line toll collection and attendance marking.',
    employees: mockEmployees.slice(0, 6).map((e) => ({ id: e.id, name: e.name })),
    modules: [{ id: 1, name: 'Attendance' }, { id: 2, name: 'Mobile App' }],
    sites: mockSites.slice(0, 3).map((s) => ({ id: s.id, name: s.name })),
    permissions: { write: true, edit: false, approve: false, delete: false },
  },
  {
    id: 2,
    name: 'Shift Supervisor',
    description: 'Manages schedules and approves leave for site staff.',
    employees: mockEmployees.slice(6, 10).map((e) => ({ id: e.id, name: e.name })),
    modules: [{ id: 1, name: 'Attendance' }, { id: 3, name: 'Schedules' }, { id: 4, name: 'Leaves' }],
    sites: mockSites.slice(0, 4).map((s) => ({ id: s.id, name: s.name })),
    permissions: { write: true, edit: true, approve: true, delete: false },
  },
  {
    id: 3,
    name: 'HR Administrator',
    description: 'Full access to employee records, roles and reports.',
    employees: mockEmployees.slice(10, 12).map((e) => ({ id: e.id, name: e.name })),
    modules: [{ id: 1, name: 'Attendance' }, { id: 5, name: 'Employees' }, { id: 6, name: 'Reports' }, { id: 7, name: 'Roles' }],
    sites: mockSites.map((s) => ({ id: s.id, name: s.name })),
    permissions: { write: true, edit: true, approve: true, delete: true },
  },
];

export const mockReports: Report[] = [
  { id: 1, title: 'Monthly Attendance Summary — June 2026', type: 'Attendance', generatedOn: '2026-07-01', siteName: 'All Sites', dateRange: 'Jun 1 – Jun 30, 2026' },
  { id: 2, title: 'Leave Utilization Report — Q2 2026', type: 'Leaves', generatedOn: '2026-07-02', siteName: 'All Sites', dateRange: 'Apr 1 – Jun 30, 2026' },
  { id: 3, title: 'Site Staffing Levels — Islamabad Toll Plaza', type: 'Staffing', generatedOn: '2026-07-05', siteName: 'Islamabad Toll Plaza', dateRange: 'Jul 2026' },
  { id: 4, title: 'Shift Coverage Audit — Rawalpindi ETTM Hub', type: 'Schedules', generatedOn: '2026-07-08', siteName: 'Rawalpindi ETTM Hub', dateRange: 'Jul 2026' },
  { id: 5, title: 'Payroll-Relevant Attendance Export', type: 'Attendance', generatedOn: '2026-07-10', siteName: 'All Sites', dateRange: 'Jun 26 – Jul 10, 2026' },
];

export const mockMonthlySummary: MonthlySummary[] = [
  { month: 'Feb', totalEmployees: 82, present: 71, absent: 5, onLeave: 6, late: 3, attendanceRate: 86.6 },
  { month: 'Mar', totalEmployees: 83, present: 74, absent: 4, onLeave: 5, late: 4, attendanceRate: 89.2 },
  { month: 'Apr', totalEmployees: 84, present: 73, absent: 6, onLeave: 5, late: 4, attendanceRate: 86.9 },
  { month: 'May', totalEmployees: 85, present: 76, absent: 3, onLeave: 6, late: 2, attendanceRate: 89.4 },
  { month: 'Jun', totalEmployees: 86, present: 78, absent: 3, onLeave: 5, late: 2, attendanceRate: 90.7 },
  { month: 'Jul', totalEmployees: 86, present: 79, absent: 2, onLeave: 4, late: 3, attendanceRate: 91.9 },
];
