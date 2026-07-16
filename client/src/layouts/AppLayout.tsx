import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { Topbar } from './Topbar';
import { PageSuspenseFallback } from '@/components/common/PageSuspenseFallback';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';

export function AppLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="container max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
            <RouteErrorBoundary>
              <React.Suspense fallback={<PageSuspenseFallback />}>
                <Outlet />
              </React.Suspense>
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
