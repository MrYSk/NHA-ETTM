import { Outlet } from 'react-router-dom';
import { Route } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10">
            <Route className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold tracking-wide">NHA &middot; ETTM DEPARTMENT</span>
        </div>

        <div className="max-w-md space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">Human Resource Information System</h2>
          <p className="text-sm text-primary-foreground/70">
            Manage employees, attendance, leaves, schedules, and site staffing across every
            Electronic Toll and Traffic Management installation on the network.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} National Highway Authority of Pakistan. Internal use only.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Made by <span className="font-medium text-primary-foreground/70">YAHYA SAJJAD</span>
          </p>
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/5" />
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <Outlet />
      </div>
    </div>
  );
}
