import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { addRole, listModules } from '@/api/roles.service';
import { listEveryEmployee } from '@/api/employees.service';
import { listSites } from '@/api/sites.service';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { CheckboxGroup } from './CheckboxGroup';

interface FormState {
  name: string;
  employeeIds: string[];
  moduleIds: string[];
  siteIds: string[];
}

const EMPTY_FORM: FormState = { name: '', employeeIds: [], moduleIds: [], siteIds: [] };

export function AddRoleDialog() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canWrite } = usePermissions();

  // A role can be granted over anyone, so the picker uses the full roster
  // rather than the current user's own scope.
  const employeesQuery = useQuery({
    queryKey: ['employees', 'all-for-roles'],
    queryFn: listEveryEmployee,
    enabled: open,
  });
  const modulesQuery = useQuery({ queryKey: queryKeys.modules(), queryFn: listModules, enabled: open });
  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites(), enabled: open });

  const mutation = useMutation({
    mutationFn: addRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role created' });
      setOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
    },
    onError: (err: { message?: string }) => {
      toast({ variant: 'destructive', title: 'Could not create role', description: err?.message });
    },
  });

  function toggle(field: 'employeeIds' | 'moduleIds' | 'siteIds', id: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], id] : prev[field].filter((v) => v !== id),
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Role name is required';
    if (form.moduleIds.length === 0) nextErrors.moduleIds = 'Select at least one module';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate({
      name: form.name.trim(),
      employeeIds: form.employeeIds,
      moduleIds: form.moduleIds,
      siteIds: form.siteIds,
    });
  }

  // Creating roles requires the write permission from the signed-in user's
  // login payload.
  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add role</DialogTitle>
          <DialogDescription>
            Name the role, then choose which employees hold it, which modules it unlocks, and which sites it
            covers.
          </DialogDescription>
        </DialogHeader>

        <form id="add-role-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              placeholder="e.g. Site Incharge (SGJ)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <CheckboxGroup
            legend="Employees"
            isLoading={employeesQuery.isLoading}
            options={(employeesQuery.data ?? [])
              .filter((e) => e.bioId)
              .map((e) => ({ id: String(e.bioId), label: `${e.name} (${e.siteName ?? 'No site'})` }))}
            selected={form.employeeIds}
            onToggle={(id, checked) => toggle('employeeIds', id, checked)}
          />

          <CheckboxGroup
            legend="Modules"
            isLoading={modulesQuery.isLoading}
            options={(modulesQuery.data ?? []).map((m) => ({ id: String(m.id), label: m.name }))}
            selected={form.moduleIds}
            onToggle={(id, checked) => toggle('moduleIds', id, checked)}
            error={errors.moduleIds}
          />

          <CheckboxGroup
            legend="Sites"
            isLoading={sitesQuery.isLoading}
            options={(sitesQuery.data ?? []).map((s) => ({ id: String(s.id), label: s.name ?? '—' }))}
            selected={form.siteIds}
            onToggle={(id, checked) => toggle('siteIds', id, checked)}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-role-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
