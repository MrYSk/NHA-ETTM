import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addLeave, checkLeaveEndDate, checkLeaveStartDate } from '@/api/leaves.service';
import { listEmployees } from '@/api/employees.service';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

// Real HRIS leave types (id -> label). The controller stores the numeric id;
// type 1 ("Short") is an hourly leave, 2/3 are full-day types.
const LEAVE_TYPES = [
  { id: '2', name: 'Casual' },
  { id: '3', name: 'Sick' },
  { id: '1', name: 'Short (hourly)' },
];

const schema = z
  .object({
    employeeId: z.string().min(1, 'Select an employee'),
    leaveType: z.string().min(1, 'Select a leave type'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().min(10, 'Please provide at least 10 characters'),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

export function AddLeaveDialog() {
  const [open, setOpen] = React.useState(false);
  const [dateWarning, setDateWarning] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canWrite } = usePermissions();

  const employeesQuery = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => listEmployees({ page: 1, pageSize: 200 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  React.useEffect(() => {
    if (!startDate) return;
    checkLeaveStartDate(startDate).then((res) => {
      if (!res.available) setDateWarning('The selected start date overlaps an existing approved leave.');
      else setDateWarning(null);
    });
  }, [startDate]);

  React.useEffect(() => {
    if (!endDate) return;
    checkLeaveEndDate(endDate).then((res) => {
      if (!res.available) setDateWarning('The selected end date overlaps an existing approved leave.');
    });
  }, [endDate]);

  const mutation = useMutation({
    mutationFn: addLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({ title: 'Leave request submitted', description: 'It is now awaiting approval.' });
      setOpen(false);
      reset();
    },
    onError: (err: { message?: string }) => {
      toast({ variant: 'destructive', title: 'Could not submit leave', description: err?.message });
    },
  });

  // Creating records requires the write permission from the signed-in
  // user's login payload.
  if (!canWrite) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add leave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add leave request</DialogTitle>
          <DialogDescription>Submit a new leave request on behalf of an employee.</DialogDescription>
        </DialogHeader>

        <form id="add-leave-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Employee</Label>
            <Controller
              control={control}
              name="employeeId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="employeeId">
                    <SelectValue placeholder="Select an employee…" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesQuery.data?.items.map((e) => (
                      // The leave system identifies people by biometric id
                      // (bioId), not the employees-table id.
                      <SelectItem key={e.id} value={String(e.bioId ?? e.id)}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="leaveType">Leave type</Label>
            <Controller
              control={control}
              name="leaveType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="leaveType">
                    <SelectValue placeholder="Select a type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leaveType && <p className="text-xs text-destructive">{errors.leaveType.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          {dateWarning && <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">{dateWarning}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" rows={3} {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-leave-form" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
