import { useQuery } from '@tanstack/react-query';
import { Clock, PenLine } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listShifts } from '@/api/shifts.service';
import { queryKeys } from '@/lib/queryClient';
import { AddShiftDialog } from './components/AddShiftDialog';

export default function ShiftsPage() {
  const shiftsQuery = useQuery({ queryKey: queryKeys.shifts(), queryFn: listShifts });
  const shifts = shiftsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shifts"
        description="Manage the working shifts used across employee schedules."
        actions={<AddShiftDialog />}
      />

      {shiftsQuery.isError && <ErrorState message="Could not load shifts." onRetry={() => shiftsQuery.refetch()} />}

      {!shiftsQuery.isError && shiftsQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {!shiftsQuery.isLoading && !shiftsQuery.isError && shifts.length === 0 && (
        <EmptyState icon={Clock} title="No shifts defined" description="Add a shift to start building schedules." />
      )}

      {!shiftsQuery.isLoading && !shiftsQuery.isError && shifts.length > 0 && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift</TableHead>
                <TableHead>Start time</TableHead>
                <TableHead>End time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="text-sm font-medium">{shift.name}</TableCell>
                  <TableCell className="text-sm">{shift.startTime}</TableCell>
                  <TableCell className="text-sm">{shift.endTime}</TableCell>
                  <TableCell>
                    <StatusBadge status={shift.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="ghost" size="icon" disabled>
                            <PenLine className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        No update endpoint documented yet &mdash; edit disabled until confirmed
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
