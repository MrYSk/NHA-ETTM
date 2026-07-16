import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getAttendanceDetail } from '@/api/attendance.service';
import { queryKeys } from '@/lib/queryClient';
import { formatDate, titleCase } from '@/utils/format';
import type { AttendanceRecord } from '@/types';

interface AttendanceDetailDrawerProps {
  recordId: AttendanceRecord['id'] | null;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDetailDrawer({ recordId, onOpenChange }: AttendanceDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendanceDetail(recordId),
    queryFn: () => getAttendanceDetail(recordId!),
    enabled: recordId !== null,
  });

  return (
    <Sheet open={recordId !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Attendance record</SheetTitle>
          <SheetDescription>Check-in and check-out details for this entry.</SheetDescription>
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
              <dt className="text-muted-foreground">Date</dt>
              <dd>{formatDate(data.date)}</dd>
              <dt className="text-muted-foreground">Check-in</dt>
              <dd>{data.checkIn ?? '—'}</dd>
              <dt className="text-muted-foreground">Check-out</dt>
              <dd>{data.checkOut ?? '—'}</dd>
              <dt className="text-muted-foreground">Source</dt>
              <dd>{titleCase(data.source)}</dd>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
