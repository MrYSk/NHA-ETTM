import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { listRoles } from '@/api/roles.service';
import { queryKeys } from '@/lib/queryClient';
import { AddRoleDialog } from './components/AddRoleDialog';
import { RoleCard } from './components/RoleCard';

export default function RolesPage() {
  const rolesQuery = useQuery({ queryKey: queryKeys.roles(), queryFn: listRoles });
  const roles = rolesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Roles & Permissions"
        description="Define roles, assign staff and sites, and control module-level permissions."
        actions={<AddRoleDialog />}
      />

      {rolesQuery.isError && <ErrorState message="Could not load roles." onRetry={() => rolesQuery.refetch()} />}

      {!rolesQuery.isError && rolesQuery.isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {!rolesQuery.isLoading && !rolesQuery.isError && roles.length === 0 && (
        <EmptyState icon={ShieldCheck} title="No roles yet" description="Create a role to start assigning permissions." />
      )}

      {!rolesQuery.isLoading && !rolesQuery.isError && roles.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
