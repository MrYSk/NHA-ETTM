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
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Employees', to: '/employees', icon: Users },
  { label: 'Attendance', to: '/attendance', icon: CalendarCheck },
  { label: 'Leaves', to: '/leaves', icon: CalendarClock },
  { label: 'Schedules', to: '/schedules', icon: CalendarRange },
  { label: 'Shifts', to: '/shifts', icon: Clock },
  { label: 'Sites', to: '/sites', icon: Building2 },
  { label: 'Roles & Permissions', to: '/roles', icon: ShieldCheck },
  { label: 'Reports', to: '/reports', icon: FileBarChart },
  { label: 'Settings', to: '/settings', icon: Settings },
];
