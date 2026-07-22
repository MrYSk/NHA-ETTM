import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, CalendarClock, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WidgetErrorBoundary } from '@/components/common/WidgetErrorBoundary';
import { StatCard } from './components/StatCard';
import { listEmployees } from '@/api/employees.service';
import { listSites } from '@/api/sites.service';
import { getMonthlySummary } from '@/api/attendance.service';
import { listLeaves } from '@/api/leaves.service';
import { queryKeys } from '@/lib/queryClient';
import { formatDate, parseDurationHours } from '@/utils/format';

const AttendanceTrendChart = React.lazy(() => import('./components/AttendanceTrendChart'));
const SiteStaffingChart = React.lazy(() => import('./components/SiteStaffingChart'));

export default function DashboardPage() {
  const employeesQuery = useQuery({
    queryKey: queryKeys.employees({ page: 1, pageSize: 1 }),
    queryFn: () => listEmployees({ page: 1, pageSize: 1 }),
  });
  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites() });
  const summaryQuery = useQuery({ queryKey: queryKeys.monthlySummary(), queryFn: getMonthlySummary });
  const pendingLeavesQuery = useQuery({
    queryKey: queryKeys.leaves({ status: 'pending', page: 1, pageSize: 5 }),
    queryFn: () => listLeaves({ status: 'pending', page: 1, pageSize: 5 }),
  });

  const summaryRows = summaryQuery.data ?? [];
  const totalTeamHours = Math.round(
    summaryRows.reduce((sum, row) => sum + parseDurationHours(row.totalTime), 0),
  );

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
          trend={sitesQuery.data ? `Across ${sitesQuery.data.length} sites` : undefined}
        />
        <StatCard
          label="Team hours logged"
          value={summaryQuery.isLoading ? '—' : `${totalTeamHours.toLocaleString()} h`}
          icon={CalendarCheck}
          trend={summaryRows.length ? `${summaryRows.length} summary periods` : undefined}
          trendTone="success"
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
          value={sitesQuery.isLoading ? '—' : sitesQuery.data?.length ?? 0}
          icon={Building2}
          trend="ETTM network"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Team hours</CardTitle>
            <CardDescription>Total logged hours per employee, from the monthly summary.</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetErrorBoundary label="attendance-trend-chart">
              {summaryQuery.isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <React.Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                  <AttendanceTrendChart data={summaryQuery.data ?? []} />
                </React.Suspense>
              )}
            </WidgetErrorBoundary>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Staffing by site</CardTitle>
            <CardDescription>Employee headcount, top sites.</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetErrorBoundary label="site-staffing-chart">
              {sitesQuery.isLoading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <React.Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
                  <SiteStaffingChart data={sitesQuery.data ?? []} />
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
