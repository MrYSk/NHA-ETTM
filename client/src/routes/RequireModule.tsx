import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/*
 * Route guard for module-restricted sections.
 *
 * Access follows the module list in the signed-in user's login payload, which
 * is what the backend role actually grants — so "Roles & Permissions" is only
 * reachable by roles that include the `roles` module (e.g. Super Admin), not by
 * anyone who merely has write access. Navigating directly to the URL is blocked
 * too, not just the sidebar link.
 *
 * A user with no module list is treated as unrestricted (organisation-wide).
 */
export function RequireModule({
  module,
  label,
  children,
}: {
  module: string;
  label: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const modules = user?.modules;
  const authorized = !modules?.length || modules.some((m) => m.toLowerCase() === module.toLowerCase());

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <ShieldAlert className="h-6 w-6 text-warning" />
        </div>
        <div>
          <p className="text-sm font-medium">Restricted page</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {label} is not part of your role&apos;s access. Contact your administrator if you need it.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
