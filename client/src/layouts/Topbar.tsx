import { Menu, Moon, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs } from './Breadcrumbs';
import { ApiStatusBadge } from './ApiStatusBadge';
import { UserMenu } from './UserMenu';
import { useTheme } from '@/hooks/useTheme';

interface TopbarProps {
  onOpenDrawer: () => void;
}

export function Topbar({ onOpenDrawer }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenDrawer} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>

      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees, sites, leaves…" className="w-64 pl-8" />
        </div>
        <ApiStatusBadge />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
