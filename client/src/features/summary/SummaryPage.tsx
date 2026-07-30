import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, Clock, Download, TrendingUp, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { listSummary, listSummarySites } from '@/api/summary.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';
import { downloadCsv, toCsv } from '@/utils/csv';

const ALL_SITES = '__all__';
const PAGE_SIZE = 10;

const hours = (value: number) => `${value.toFixed(2)} h`;

export default function SummaryPage() {
  const [search, setSearch] = React.useState('');
  const [siteName, setSiteName] = React.useState(ALL_SITES);
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const debouncedSearch = useDebounce(search);

  const filters = React.useMemo(
    () => ({
      search: debouncedSearch,
      siteName: siteName === ALL_SITES ? undefined : siteName,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [debouncedSearch, siteName, dateFrom, dateTo],
  );

  React.useEffect(() => setPage(1), [filters]);

  const summaryQuery = useQuery({
    queryKey: queryKeys.summary(filters),
    queryFn: () => listSummary(filters),
    placeholderData: (prev) => prev,
  });

  const sitesQuery = useQuery({ queryKey: queryKeys.summarySites(), queryFn: listSummarySites });

  const records = React.useMemo(() => summaryQuery.data ?? [], [summaryQuery.data]);
  const hasFilters = !!debouncedSearch || siteName !== ALL_SITES || !!dateFrom || !!dateTo;

  const totals = React.useMemo(() => {
    const worked = records.reduce((sum, r) => sum + r.workedHours, 0);
    const required = records.reduce((sum, r) => sum + r.requiredHours, 0);
    return {
      employees: new Set(records.map((r) => r.bioId)).size,
      periods: records.length,
      worked,
      utilisation: required > 0 ? Math.round((worked / required) * 100) : 0,
    };
  }, [records]);

  const pageRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleExport() {
    const csv = toCsv(records, [
      { header: 'Employee', value: (r) => r.employeeName },
      { header: 'Biometric ID', value: (r) => r.bioId },
      { header: 'Site', value: (r) => r.siteName },
      { header: 'Designation', value: (r) => r.designation },
      { header: 'Shift type', value: (r) => r.shiftType },
      { header: 'Period start', value: (r) => r.periodStart },
      { header: 'Period end', value: (r) => r.periodEnd },
      { header: 'Required hours', value: (r) => r.requiredHours.toFixed(2) },
      { header: 'HQ hours', value: (r) => r.hqHours.toFixed(2) },
      { header: 'Site hours', value: (r) => r.siteHours.toFixed(2) },
      { header: 'Worked hours', value: (r) => r.workedHours.toFixed(2) },
      { header: 'Acceptable hours', value: (r) => r.acceptableHours.toFixed(2) },
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`nha-ettm-summary-${stamp}.csv`, csv);
  }

  function clearFilters() {
    setSearch('');
    setSiteName(ALL_SITES);
    setDateFrom('');
    setDateTo('');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Summary"
        description="Monthly hours per employee, from the HRIS monthly summary."
        actions={
          <Button size="sm" onClick={handleExport} disabled={records.length === 0} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={summaryQuery.isLoading ? '—' : totals.employees} icon={Users} />
        <StatCard
          label="Summary periods"
          value={summaryQuery.isLoading ? '—' : totals.periods}
          icon={CalendarRange}
        />
        <StatCard
          label="Hours worked"
          value={summaryQuery.isLoading ? '—' : `${Math.round(totals.worked).toLocaleString()} h`}
          icon={Clock}
          trendTone="success"
        />
        <StatCard
          label="Utilisation"
          value={summaryQuery.isLoading ? '—' : `${totals.utilisation}%`}
          icon={TrendingUp}
          trend="Worked vs scheduled"
          trendTone={totals.utilisation >= 80 ? 'success' : 'warning'}
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="summary-search" className="text-xs text-muted-foreground">
              Search
            </Label>
            <SearchInput
              id="summary-search"
              value={search}
              onChange={setSearch}
              placeholder="Employee, site, or ID…"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Site</Label>
            <Select value={siteName} onValueChange={setSiteName}>
              <SelectTrigger aria-label="Filter summary by site">
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SITES}>All sites</SelectItem>
                {sitesQuery.data?.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
              From date
            </Label>
            <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
              To date
            </Label>
            <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {hasFilters && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {summaryQuery.isError && (
        <ErrorState message="Could not load the summary." onRetry={() => summaryQuery.refetch()} />
      )}

      {!summaryQuery.isError && summaryQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {!summaryQuery.isLoading && !summaryQuery.isError && records.length === 0 && (
        <EmptyState
          icon={CalendarRange}
          title="No summary records"
          description={
            hasFilters
              ? 'No periods match these filters. Try widening the date range.'
              : 'No monthly summary data is available for your employees yet.'
          }
        />
      )}

      {!summaryQuery.isLoading && !summaryQuery.isError && records.length > 0 && (
        <Card>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Scheduled</TableHead>
                  <TableHead className="text-right">Worked</TableHead>
                  <TableHead className="text-right">Acceptable</TableHead>
                  <TableHead className="w-32">Utilisation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{record.employeeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.designation} &middot; {record.bioId}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.siteName}
                      {record.shiftType && (
                        <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
                          {record.shiftType}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(record.periodStart)} &ndash; {formatDate(record.periodEnd)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {hours(record.requiredHours)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums">
                      {hours(record.workedHours)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {hours(record.acceptableHours)}
                    </TableCell>
                    <TableCell>
                      <UtilisationBar worked={record.workedHours} required={record.requiredHours} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {pageRecords.map((record) => (
              <div key={record.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{record.employeeName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {record.siteName} &middot; {record.designation}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {record.shiftType}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(record.periodStart)} &ndash; {formatDate(record.periodEnd)}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Worked <span className="font-medium text-foreground">{hours(record.workedHours)}</span> of{' '}
                    {hours(record.requiredHours)}
                  </span>
                </div>
                <UtilisationBar worked={record.workedHours} required={record.requiredHours} />
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={records.length} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}

function UtilisationBar({ worked, required }: { worked: number; required: number }) {
  const percent = required > 0 ? Math.min(Math.round((worked / required) * 100), 100) : 0;
  const tone = percent >= 80 ? 'bg-success' : percent >= 50 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{percent}%</span>
    </div>
  );
}
