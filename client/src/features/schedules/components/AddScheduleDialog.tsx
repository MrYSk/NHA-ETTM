import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addSchedule, getBlockedDates } from '@/api/schedules.service';
import { listSites } from '@/api/sites.service';
import { listEmployees } from '@/api/employees.service';
import { listShifts } from '@/api/shifts.service';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/queryClient';

const schema = z
  .object({
    siteId: z.string().min(1, 'Select a site'),
    employeeId: z.string().min(1, 'Select an employee'),
    shiftId: z.string().min(1, 'Select a shift'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  });

type FormValues = z.infer<typeof schema>;

export function AddScheduleDialog() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const siteId = watch('siteId');
  const startDate = watch('startDate');

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites(), enabled: open });
  const employeesQuery = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => listEmployees({ page: 1, pageSize: 200 }),
    enabled: open,
  });
  const shiftsQuery = useQuery({ queryKey: queryKeys.shifts(), queryFn: listShifts, enabled: open });
  const blockedDatesQuery = useQuery({
    queryKey: queryKeys.blockedDates(siteId),
    queryFn: () => getBlockedDates(siteId),
    enabled: open && !!siteId,
  });

  const isBlocked = !!startDate && blockedDatesQuery.data?.includes(startDate);

  const mutation = useMutation({
    mutationFn: addSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({ title: 'Schedule created' });
      setOpen(false);
      reset();
    },
    onError: (err: { message?: string }) => {
      toast({ variant: 'destructive', title: 'Could not create schedule', description: err?.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add schedule</DialogTitle>
          <DialogDescription>Assign an employee to a shift at a site for a date range.</DialogDescription>
        </DialogHeader>

        <form id="add-schedule-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-1.5">
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
                      <SelectItem key={e.id} value={String(e.id)}>
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
            <Label htmlFor="shiftId">Shift</Label>
            <Controller
              control={control}
              name="shiftId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="shiftId">
                    <SelectValue placeholder="Select a shift…" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftsQuery.data?.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name} ({s.startTime}–{s.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.shiftId && <p className="text-xs text-destructive">{errors.shiftId.message}</p>}
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

          {isBlocked && (
            <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
              This start date is blocked for the selected site. Choose a different date.
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="add-schedule-form" disabled={mutation.isPending || isBlocked}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
