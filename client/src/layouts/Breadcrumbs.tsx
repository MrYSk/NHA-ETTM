import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { NAV_ITEMS } from './nav-config';
import { titleCase } from '@/utils/format';

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        <span className="font-medium text-foreground">Dashboard</span>
      </div>
    );
  }

  const rootMatch = NAV_ITEMS.find((item) => item.to === `/${segments[0]}`);

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link to="/" className="flex items-center hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <Link to={`/${segments[0]}`} className="hover:text-foreground">
        {rootMatch?.label ?? titleCase(segments[0])}
      </Link>
      {segments.slice(1).map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{titleCase(seg)}</span>
        </span>
      ))}
    </nav>
  );
}
