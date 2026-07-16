import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { addRole } from '@/api/roles.service';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  name: z.string().min(2, 'Role name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddRoleDialog() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: addRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({ title: 'Role created' });
      setOpen(false);
      reset();
    },
    onError: (err: { message?: string }) => {
      toast({ variant: 'destructive', title: 'Could not create role', description: err?.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add role</DialogTitle>
          <DialogDescription>Create a new role, then assign employees, modules, and sites.</DialogDescription>
        </DialogHeader>

        <form id="add-role-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">Role name</Label>
            <Input id="name" placeholder="e.g. Shift Supervisor" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={3} {...register('description')} />
          </div>
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
