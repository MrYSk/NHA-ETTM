import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, UserCheck, UserX, Clock3, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { listAllAttendance, listAttendance, listMobileAttendance } from '@/api/attendance.service';
import { listSites } from '@/api/sites.service';
import { queryKeys } from '@/lib/queryClient';
import { SearchInput } from '@/components/common/SearchInput';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadCsv, toCsv } from '@/utils/csv';
import { useToast } from '@/hooks/use-toast';
import { AttendanceTable } from './components/AttendanceTable';
import { AttendanceDetailDrawer } from './components/AttendanceDetailDrawer';
import type { AttendanceRecord, AttendanceStatus } from '@/types';

const PAGE_SIZE = 10;
const ALL = '__all__';
const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'leave', 'half-day'];

export default function AttendancePage() {
  const [tab, setTab] = React.useState<'terminal' | 'mobile'>('terminal');
  const [siteId, setSiteId] = React.useState(ALL);
  const [status, setStatus] = React.useState<string>(ALL);
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<AttendanceRecord['id'] | null>(null);
  const [search, setSearch] = React.useState('');
  const [isExporting, setIsExporting] = React.useState(false);
  const debouncedSearch = useDebounce(search);
  const { toast } = useToast();

  React.useEffect(() => setPage(1), [tab, siteId, status, dateFrom, dateTo, debouncedSearch]);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    siteId: siteId === ALL ? undefined : siteId,
    status: status === ALL ? undefined : (status as AttendanceStatus),
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const terminalQuery = useQuery({
    queryKey: queryKeys.attendance(filters),
    queryFn: () => listAttendance(filters),
    enabled: tab === 'terminal',
    placeholderData: (prev) => prev,
  });

  const mobileQuery = useQuery({
    queryKey: queryKeys.attendance({ ...filters, mobile: true }),
    queryFn: () => listMobileAttendance(filters),
    enabled: tab === 'mobile',
    placeholderData: (prev) => prev,
  });

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites() });

  const activeQuery = tab === 'terminal' ? terminalQuery : mobileQuery;
  const summary = React.useMemo(() => {
    const items = activeQuery.data?.items ?? [];
    const present = items.filter((i) => i.status === 'present').length;
    const absent = items.filter((i) => i.status === 'absent').length;
    const late = items.filter((i) => i.status === 'late').length;
    const leave = items.filter((i) => i.status === 'leave').length;
    return { present, absent, late, leave };
  }, [activeQuery.data]);

  /*
   * Download every record matching the current filters (not just the page)
   * for whichever tab is open, so terminal and mobile export separately.
   */
  async function handleExport() {
    setIsExporting(true);
    try {
      const records = await listAllAttendance(filters, tab);
      if (records.length === 0) {
        toast({ title: 'Nothing to export', description: 'No records match the current filters.' });
        return;
      }
      const csv = toCsv(records, [
        { header: 'Date', value: (r) => r.date ?? '' },
        { header: 'Employee', value: (r) => r.employeeName ?? '' },
        { header: 'Bio ID', value: (r) => r.employeeId ?? '' },
        { header: 'Site', value: (r) => r.siteName ?? '' },
        { header: 'Check in', value: (r) => r.checkIn ?? '' },
        { header: 'Check out', value: (r) => r.checkOut ?? '' },
        { header: 'Source', value: (r) => r.source ?? '' },
      ]);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`nha-ettm-attendance-${tab}-${stamp}.csv`, csv);
    } catch {
      toast({ variant: 'destructive', title: 'Could not export attendance' });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance"
        description="Terminal check-ins and mobile attendance across all ETTM sites."
        actions={
          <Button size="sm" onClick={handleExport} disabled={isExporting} className="gap-1.5">
            <Download className="h-4 w-4" />
            {isExporting ? 'Preparing…' : 'Export CSV'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Present (page)" value={summary.present} icon={UserCheck} trendTone="success" />
        <StatCard label="Absent (page)" value={summary.absent} icon={UserX} trendTone="destructive" />
        <StatCard label="Late (page)" value={summary.late} icon={Clock3} trendTone="warning" />
        <StatCard label="On leave (page)" value={summary.leave} icon={CalendarClock} trendTone="neutral" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'terminal' | 'mobile')}>
        <TabsList>
          <TabsTrigger value="terminal">Terminal attendance</TabsTrigger>
          <TabsTrigger value="mobile">Mobile attendance</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="attendance-search">
              Search
            </label>
            <SearchInput
              id="attendance-search"
              value={search}
              onChange={setSearch}
              placeholder="Employee or bio ID…"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From date</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To date</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Site</label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <AttendanceTable
        query={activeQuery}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        onSelectRecord={setSelectedId}
      />

      <AttendanceDetailDrawer recordId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
