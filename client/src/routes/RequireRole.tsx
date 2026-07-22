import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/*
 * Gate on the real permission flags from the login response rather than a
 * role-name list: managing roles requires at least edit or write rights.
 */
export function RequireRole({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const authorized = !!user?.permissions?.edit || !!user?.permissions?.write;

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <ShieldAlert className="h-6 w-6 text-warning" />
        </div>
        <div>
          <p className="text-sm font-medium">Restricted page</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Roles &amp; Permissions requires write or edit permission. Contact your administrator if
            you need access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
