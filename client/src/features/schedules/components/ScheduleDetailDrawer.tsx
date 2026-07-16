import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getScheduleDetail } from '@/api/schedules.service';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';
import type { Schedule } from '@/types';

interface ScheduleDetailDrawerProps {
  scheduleId: Schedule['id'] | null;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleDetailDrawer({ scheduleId, onOpenChange }: ScheduleDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.scheduleDetail(scheduleId),
    queryFn: () => getScheduleDetail(scheduleId!),
    enabled: scheduleId !== null,
  });

  return (
    <Sheet open={scheduleId !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Schedule details</SheetTitle>
          <SheetDescription>Shift assignment for the selected date range.</SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && data && (
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-base font-semibold">{data.employeeName}</p>
              <p className="text-sm text-muted-foreground">{data.siteName}</p>
            </div>
            <StatusBadge status={data.status} />
            <Separator />
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Shift</dt>
              <dd>{data.shiftName}</dd>
              <dt className="text-muted-foreground">Start date</dt>
              <dd>{formatDate(data.startDate)}</dd>
              <dt className="text-muted-foreground">End date</dt>
              <dd>{formatDate(data.endDate)}</dd>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
