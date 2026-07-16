import { NavLink } from 'react-router-dom';
import { LogOut, Route } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav-config';
import { useAuth } from '@/hooks/useAuth';

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { logout } = useAuth();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Route className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <SheetTitle>NHA ETTM</SheetTitle>
              <p className="text-[11px] text-muted-foreground">HRIS Dashboard</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="space-y-0.5 p-3">
          {NAV_ITEMS.map((item) => (
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
