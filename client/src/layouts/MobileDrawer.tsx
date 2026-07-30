import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { visibleNavItems } from './nav-config';
import { useAuth } from '@/hooks/useAuth';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { user } = useAuth();
  const navItems = visibleNavItems(user?.modules);
  const { logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <Logo className="h-9 w-9" />
            <div className="leading-tight">
              <SheetTitle>NHA ETTM</SheetTitle>
              <p className="text-[11px] text-muted-foreground">HRIS Dashboard</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="space-y-0.5 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => onOpenChange(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70',
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              onOpenChange(false);
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary/70"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
