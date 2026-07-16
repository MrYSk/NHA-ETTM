import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-config';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent">
          <Route className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">NHA ETTM</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">HRIS Dashboard</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 scrollbar-thin">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} to={item.to} icon={item.icon} label={item.label} collapsed={collapsed} end={item.to === '/'} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
}: {
  to: string;
  icon: typeof Route;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  const link = (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-sidebar-accent text-sidebar-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
