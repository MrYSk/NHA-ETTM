import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { listLeaves } from '@/api/leaves.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';
import { AddLeaveDialog } from './components/AddLeaveDialog';
import { LeaveDetailDrawer } from './components/LeaveDetailDrawer';
import type { Leave, LeaveStatus } from '@/types';

const PAGE_SIZE = 10;
const ALL = '__all__';

export default function LeavesPage() {
  const [status, setStatus] = React.useState<string>(ALL);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<Leave['id'] | null>(null);

  const debouncedSearch = useDebounce(search);
  React.useEffect(() => setPage(1), [status, debouncedSearch]);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status: status === ALL ? undefined : (status as LeaveStatus),
  };

  const leavesQuery = useQuery({
    queryKey: queryKeys.leaves(filters),
    queryFn: () => listLeaves(filters),
    placeholderData: (prev) => prev,
  });

  const leaves = leavesQuery.data?.items ?? [];
  const isEmpty = !leavesQuery.isLoading && !leavesQuery.isError && leaves.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leaves"
        description="Review, approve, and manage employee leave requests."
        actions={<AddLeaveDialog />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={setStatus}>
          <TabsList>
            <TabsTrigger value={ALL}>All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="disapproved">Disapproved</TabsTrigger>
          </TabsList>
        </Tabs>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by employee or leave type…" className="sm:w-72" />
      </div>

      {leavesQuery.isError && <ErrorState message="Could not load leave requests." onRetry={() => leavesQuery.refetch()} />}

      {!leavesQuery.isError && leavesQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <EmptyState icon={CalendarClock} title="No leave requests" description="Try a different filter, or add a new leave request." />
      )}

      {!leavesQuery.isLoading && !leavesQuery.isError && leaves.length > 0 && (
        <Card>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Applied on</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.id} className="cursor-pointer" onClick={() => setSelectedId(leave.id)}>
                    <TableCell className="text-sm font-medium">{leave.employeeName}</TableCell>
                    <TableCell className="text-sm">{leave.leaveType}</TableCell>
                    <TableCell className="text-sm">{formatDate(leave.startDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(leave.endDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(leave.appliedOn)}</TableCell>
                    <TableCell>
                      <StatusBadge status={leave.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {leaves.map((leave) => (
              <button key={leave.id} onClick={() => setSelectedId(leave.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{leave.employeeName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {leave.leaveType} &middot; {formatDate(leave.startDate)}
                  </p>
                </div>
                <StatusBadge status={leave.status} />
              </button>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={leavesQuery.data?.total ?? 0} onPageChange={setPage} />
        </Card>
      )}

      <LeaveDetailDrawer leaveId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
