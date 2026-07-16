import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listSchedules } from '@/api/schedules.service';
import { listSites } from '@/api/sites.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';
import { AddScheduleDialog } from './components/AddScheduleDialog';
import { ScheduleDetailDrawer } from './components/ScheduleDetailDrawer';
import type { Schedule } from '@/types';

const PAGE_SIZE = 10;
const ALL = '__all__';

export default function SchedulesPage() {
  const [search, setSearch] = React.useState('');
  const [siteId, setSiteId] = React.useState(ALL);
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<Schedule['id'] | null>(null);

  const debouncedSearch = useDebounce(search);
  React.useEffect(() => setPage(1), [debouncedSearch, siteId]);

  const filters = { page, pageSize: PAGE_SIZE, search: debouncedSearch, siteId: siteId === ALL ? undefined : siteId };

  const schedulesQuery = useQuery({
    queryKey: queryKeys.schedules(filters),
    queryFn: () => listSchedules(filters),
    placeholderData: (prev) => prev,
  });

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites() });

  const schedules = schedulesQuery.data?.items ?? [];
  const isEmpty = !schedulesQuery.isLoading && !schedulesQuery.isError && schedules.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Schedules"
        description="Plan shift assignments by site, employee, and date range."
        actions={<AddScheduleDialog />}
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by employee, site, or shift…" className="sm:w-72" />
          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sites</SelectItem>
              {sitesQuery.data?.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {schedulesQuery.isError && <ErrorState message="Could not load schedules." onRetry={() => schedulesQuery.refetch()} />}

      {!schedulesQuery.isError && schedulesQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <EmptyState icon={CalendarRange} title="No schedules found" description="Try a different site, or create a new schedule." />
      )}

      {!schedulesQuery.isLoading && !schedulesQuery.isError && schedules.length > 0 && (
        <Card>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedId(s.id)}>
                    <TableCell className="text-sm font-medium">{s.employeeName}</TableCell>
                    <TableCell className="text-sm">{s.siteName}</TableCell>
                    <TableCell className="text-sm">{s.shiftName}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.startDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(s.endDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {schedules.map((s) => (
              <button key={s.id} onClick={() => setSelectedId(s.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.employeeName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.siteName} &middot; {s.shiftName}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </button>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={schedulesQuery.data?.total ?? 0} onPageChange={setPage} />
        </Card>
      )}

      <ScheduleDetailDrawer scheduleId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
