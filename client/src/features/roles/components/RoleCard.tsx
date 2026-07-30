import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  removeEmployeeFromRole,
  removeModuleFromRole,
  removeSiteFromRole,
  togglePermission,
} from '@/api/roles.service';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission, Role } from '@/types';

const PERMISSION_LABELS: { key: keyof Permission; label: string }[] = [
  { key: 'write', label: 'Write' },
  { key: 'edit', label: 'Edit' },
  { key: 'approve', label: 'Approve' },
  { key: 'delete', label: 'Delete' },
];

export function RoleCard({ role }: { role: Role }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Changing a role's permissions is an edit; unassigning is a delete.
  const { canEdit, canDelete } = usePermissions();
  const [pendingRemoval, setPendingRemoval] = React.useState<
    { type: 'employee' | 'module' | 'site'; id: string | number; label?: string } | null
  >(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] });

  const toggleMutation = useMutation({
    mutationFn: ({ permission, value }: { permission: keyof Permission; value: boolean }) =>
      togglePermission(role.id, permission, value),
    onSuccess: invalidate,
    onError: () => toast({ variant: 'destructive', title: 'Could not update permission' }),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!pendingRemoval) return;
      if (pendingRemoval.type === 'employee') return removeEmployeeFromRole(role.id, pendingRemoval.id);
      if (pendingRemoval.type === 'module') return removeModuleFromRole(role.id, pendingRemoval.id);
      return removeSiteFromRole(role.id, pendingRemoval.id);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Removed' });
      setPendingRemoval(null);
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{role.name}</CardTitle>
          {role.description && <CardDescription>{role.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PERMISSION_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  {label}
                  <Switch
                    checked={!!role.permissions?.[key]}
                    disabled={!canEdit}
                    onCheckedChange={(value) => toggleMutation.mutate({ permission: key, value })}
                  />
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <AssignmentList
            title="Employees"
            items={role.employees?.map((e) => ({ id: e.id, label: e.name ?? '' })) ?? []}
            canRemove={canDelete}
            onRemove={(id, label) => setPendingRemoval({ type: 'employee', id, label })}
          />
          <AssignmentList
            title="Modules"
            items={role.modules?.map((m) => ({ id: m.id, label: m.name ?? '' })) ?? []}
            canRemove={canDelete}
            onRemove={(id, label) => setPendingRemoval({ type: 'module', id, label })}
          />
          <AssignmentList
            title="Sites"
            items={role.sites?.map((s) => ({ id: s.id, label: s.name ?? '' })) ?? []}
            canRemove={canDelete}
            onRemove={(id, label) => setPendingRemoval({ type: 'site', id, label })}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingRemoval}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title={`Remove ${pendingRemoval?.label ?? 'this item'}?`}
        description="This will unassign it from the role immediately."
        confirmLabel={removeMutation.isPending ? 'Removing…' : 'Remove'}
        variant="destructive"
        isLoading={removeMutation.isPending}
        onConfirm={() => removeMutation.mutate()}
      />
    </>
  );
}

function AssignmentList({
  title,
  items,
  canRemove,
  onRemove,
}: {
  title: string;
  items: { id: string | number; label: string }[];
  canRemove: boolean;
  onRemove: (id: string | number, label: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None assigned.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item.id} variant="secondary" className={canRemove ? 'gap-1 pr-1' : undefined}>
              {item.label}
              {canRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full p-0 hover:bg-transparent"
                  onClick={() => onRemove(item.id, item.label)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
