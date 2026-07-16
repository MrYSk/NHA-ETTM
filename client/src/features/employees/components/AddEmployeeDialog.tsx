import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addEmployee } from '@/api/employees.service';
import { listSites } from '@/api/sites.service';
import { listDesignations } from '@/api/sites.service';
import { queryKeys } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Enter the employee\u2019s full name'),
  employeeCode: z.string().min(2, 'Employee code is required'),
  designation: z.string().min(1, 'Select a designation'),
  siteId: z.string().min(1, 'Select a site'),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function AddEmployeeDialog() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites(), enabled: open });
  const designationsQuery = useQuery({
    queryKey: queryKeys.designations(),
    queryFn: listDesignations,
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: 'Employee added', description: 'The new employee record has been saved.' });
      setOpen(false);
      reset();
    },
    onError: (err: { message?: string }) => {
      toast({ variant: 'destructive', title: 'Could not add employee', description: err?.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
          <DialogDescription>Create a new employee record for an ETTM site.</DialogDescription>
        </DialogHeader>

        <form
          id="add-employee-form"
          onSubmit={handleSubmit((values) =>
            mutation.mutate({ ...values, email: values.email || undefined }),
          )}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="employeeCode">Employee code</Label>
              <Input id="employeeCode" placeholder="ETTM-1001" {...register('employeeCode')} />
              {errors.employeeCode && <p className="text-xs text-destructive">{errors.employeeCode.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Controller
                control={control}
                name="designation"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="designation">
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {designationsQuery.data?.map((d) => (
                        <SelectItem key={d.id} value={d.title ?? ''}>
                          {d.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.designation && <p className="text-xs text-destructive">{errors.designation.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="siteId">Site</Label>
              <Controller
                control={control}
                name="siteId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="siteId">
                      <SelectValue placeholder="Select a site…" />
                    </SelectTrigger>
                    <SelectContent>
                      {sitesQuery.data?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.siteId && <p className="text-xs text-destructive">{errors.siteId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optional)</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-employee-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save employee
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
