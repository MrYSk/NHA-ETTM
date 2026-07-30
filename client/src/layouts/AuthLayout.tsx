import { Outlet } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <Logo className="h-10 w-10" />
          <span className="text-sm font-semibold tracking-wide">NHA &middot; ETTM DEPARTMENT</span>
        </div>

        <div className="max-w-md space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">Human Resource Information System</h2>
          <p className="text-sm text-primary-foreground/70">
            Manage employees, attendance, leaves, schedules, and site staffing across every
            Electronic Toll and Traffic Management installation on the network.
          </p>
        </div>

        <div className="space-y-0.5">
          <p className="text-xs text-primary-foreground/50">
            &copy; {new Date().getFullYear()} National Highway Authority of Pakistan. Internal use only.
          </p>
          <p className="text-[11px] font-medium tracking-wide text-primary-foreground/60">NTOC, NHA</p>
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
