import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Clock,
  Building2,
  ShieldCheck,
  FileBarChart,
  FileSpreadsheet,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /*
   * The module this section belongs to, as named in the login response's
   * module list. When set, the section is only shown to users whose role
   * unlocks that module — so "Roles & Permissions" stays hidden from everyone
   * except roles that actually include it (e.g. Super Admin). Items with no
   * module are always available.
   */
  module?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users, module: 'employees' },
  { label: 'Attendance', to: '/attendance', icon: CalendarCheck, module: 'attendance' },
  { label: 'Leaves', to: '/leaves', icon: CalendarClock, module: 'leaves' },
  { label: 'Schedules', to: '/schedules', icon: CalendarRange, module: 'schedules' },
  { label: 'Shifts', to: '/shifts', icon: Clock, module: 'schedules' },
  { label: 'Sites', to: '/sites', icon: Building2 },
  { label: 'Roles & Permissions', to: '/roles', icon: ShieldCheck, module: 'roles' },
  { label: 'Summary', to: '/summary', icon: FileBarChart, module: 'summary' },
  { label: 'Reporting', to: '/reporting', icon: FileSpreadsheet, module: 'reporting' },
  { label: 'Settings', to: '/settings', icon: Settings },
];

/**
 * Nav sections visible to a user with the given unlocked modules. An empty or
 * missing module list means unrestricted (organisation-wide roles).
 */
export function visibleNavItems(modules: string[] | undefined): NavItem[] {
  if (!modules?.length) return NAV_ITEMS;
  const unlocked = new Set(modules.map((m) => m.toLowerCase()));
  return NAV_ITEMS.filter((item) => !item.module || unlocked.has(item.module));
}
