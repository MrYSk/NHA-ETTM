import { CalendarX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, titleCase } from '@/utils/format';
import type { AttendanceRecord, PaginatedResult } from '@/types';
import type { UseQueryResult } from '@tanstack/react-query';

interface AttendanceTableProps {
  query: UseQueryResult<PaginatedResult<AttendanceRecord>>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectRecord: (id: AttendanceRecord['id']) => void;
}

export function AttendanceTable({ query, page, pageSize, onPageChange, onSelectRecord }: AttendanceTableProps) {
  const records = query.data?.items ?? [];

  if (query.isError) {
    return <ErrorState message="Could not load attendance records." onRetry={() => query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState icon={CalendarX} title="No attendance records" description="Try widening your date range or clearing filters." />
    );
  }

  return (
    <Card>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="cursor-pointer" onClick={() => onSelectRecord(record.id)}>
                <TableCell className="text-sm font-medium">{record.employeeName}</TableCell>
                <TableCell className="text-sm">{record.siteName}</TableCell>
                <TableCell className="text-sm">{formatDate(record.date)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{record.checkIn ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{record.checkOut ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{titleCase(record.source)}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {records.map((record) => (
          <button key={record.id} onClick={() => onSelectRecord(record.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{record.employeeName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {record.siteName} &middot; {formatDate(record.date)}
              </p>
            </div>
            <StatusBadge status={record.status} />
          </button>
        ))}
      </div>

      <Pagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} onPageChange={onPageChange} />
    </Card>
  );
}
