import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, Building2, BadgeCheck, CalendarDays } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getEmployee } from '@/api/employees.service';
import { queryKeys } from '@/lib/queryClient';
import { formatDate, initials } from '@/utils/format';
import type { Employee } from '@/types';

interface EmployeeDetailDrawerProps {
  employeeId: Employee['id'] | null;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailDrawer({ employeeId, onOpenChange }: EmployeeDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employee(employeeId),
    queryFn: () => getEmployee(employeeId!),
    enabled: employeeId !== null,
  });

  return (
    <Sheet open={employeeId !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Employee details</SheetTitle>
          <SheetDescription>Full profile and site assignment.</SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {!isLoading && data && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-base">{initials(data.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{data.name}</p>
                <p className="truncate text-sm text-muted-foreground">{data.designation}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={data.status} />
              <span className="text-xs text-muted-foreground">{data.employeeCode}</span>
            </div>

            <Separator />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{data.siteName ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{data.roleName ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{data.phone ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{data.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Joined {formatDate(data.joiningDate)}</span>
              </div>
            </dl>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
