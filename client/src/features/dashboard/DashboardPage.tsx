import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, CalendarClock, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WidgetErrorBoundary } from '@/components/common/WidgetErrorBoundary';
import { StatCard } from './components/StatCard';
import { listEmployees } from '@/api/employees.service';
import { listSites } from '@/api/sites.service';
import { getAttendanceStats } from '@/api/attendance.service';
import { listLeaves } from '@/api/leaves.service';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';

const AttendanceTrendChart = React.lazy(() => import('./components/AttendanceTrendChart'));
const SiteStaffingChart = React.lazy(() => import('./components/SiteStaffingChart'));

const ALL_SITES = '__all__';

export default function DashboardPage() {
  const [siteFilter, setSiteFilter] = React.useState(ALL_SITES);

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, pageSize: 1 }),
    queryFn: () => listEmployees({ page: 1, pageSize: 1 }),
  });
  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites() });
  const attendanceStatsQuery = useQuery({
    queryKey: queryKeys.attendanceStats(),
    queryFn: getAttendanceStats,
  });
  const pendingLeavesQuery = useQuery({
    queryKey: queryKeys.leaves({ status: 'pending', page: 1, pageSize: 5 }),
    queryFn: () => listLeaves({ status: 'pending', page: 1, pageSize: 5 }),
  });

  const sites = sitesQuery.data ?? [];
  const stats = attendanceStatsQuery.data;
  const allSitesSelected = siteFilter === ALL_SITES;

  // Present count and trend series both follow the selected site.
  const presentCount = allSitesSelected
    ? stats?.presentCount ?? 0
    : stats?.presentBySite[siteFilter] ?? 0;

  const dailySeries = React.useMemo(
    () =>
      (stats?.daily ?? []).map((day) => ({
        date: day.date,
        present: allSitesSelected ? day.present : day.bySite[siteFilter] ?? 0,
      })),
    [stats, siteFilter, allSitesSelected],
  );

  const selectedSiteName = stats?.sites.find((s) => s.id === siteFilter)?.name;
  const presentTrend = stats?.latestDate
    ? `${allSitesSelected ? 'All sites' : selectedSiteName ?? 'Site'} · ${formatDate(stats.latestDate)}`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live overview of workforce attendance, leave, and site staffing across the ETTM network."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total employees"
          value={employeesQuery.isLoading ? '—' : employeesQuery.data?.total ?? 0}
          icon={Users}
          trend={sites.length ? `Across ${sites.length} sites` : undefined}
        />
        <StatCard
          label="Present employees"
          value={attendanceStatsQuery.isLoading ? '—' : presentCount}
          icon={UserCheck}
          trend={presentTrend}
          trendTone="success"
          footer={
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="h-8 text-xs" aria-label="Filter present employees by site">
                <SelectValue placeholder="All sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SITES}>All sites</SelectItem>
                {stats?.sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({stats.presentBySite[s.id] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
        <StatCard
          label="Pending leave requests"
          value={pendingLeavesQuery.isLoading ? '—' : pendingLeavesQuery.data?.total ?? 0}
          icon={CalendarClock}
          trend="Awaiting approval"
          trendTone="warning"
        />
        <StatCard
          label="Sites"
          value={sitesQuery.isLoading ? '—' : sites.length}
          icon={Building2}
          trend="ETTM network"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Daily attendance</CardTitle>
            <CardDescription>
              Employees who checked in over the last 14 recorded days
              {allSitesSelected ? ' across all sites' : ` at ${selectedSiteName ?? 'the selected site'}`}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetErrorBoundary label="attendance-trend-chart">
              {attendanceStatsQuery.isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <React.Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                  <AttendanceTrendChart data={dailySeries} />
                </React.Suspense>
              )}
            </WidgetErrorBoundary>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Staffing by site</CardTitle>
            <CardDescription>Employees assigned to each of the {sites.length || 16} sites.</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetErrorBoundary label="site-staffing-chart">
              {sitesQuery.isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <React.Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                  <SiteStaffingChart data={sites} />
                </React.Suspense>
              )}
            </WidgetErrorBoundary>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending leave requests</CardTitle>
          <CardDescription>Requests awaiting supervisor approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingLeavesQuery.isLoading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}

          {!pendingLeavesQuery.isLoading && (pendingLeavesQuery.data?.items.length ?? 0) === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No pending leave requests.</p>
          )}

          {pendingLeavesQuery.data?.items.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between rounded-md border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{leave.employeeName}</p>
                <p className="text-xs text-muted-foreground">
                  {leave.leaveType} &middot; {formatDate(leave.startDate)} &ndash; {formatDate(leave.endDate)}
                </p>
              </div>
              <StatusBadge status={leave.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
