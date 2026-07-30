import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  listReporting,
  listReportingEmployees,
  listReportingMonths,
  type ReportingRecord,
} from '@/api/reporting.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { downloadCsv, toCsvRows } from '@/utils/csv';
import { formatDate, sumDurations } from '@/utils/format';

const ALL_MONTHS = '__all__';

/** "2026-07" -> "July 2026" */
function monthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** Weekday name, so weekends stand out in a printed report. */
function weekday(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-GB', { weekday: 'long' });
}

/** The per-day columns shown under each officer's heading. */
const DAY_COLUMNS = [
  { header: 'Date', value: (r: ReportingRecord) => formatDate(r.date), csv: (r: ReportingRecord) => r.date },
  { header: 'Day', value: (r: ReportingRecord) => weekday(r.date) },
  { header: 'Check in', value: (r: ReportingRecord) => r.checkIn, align: true },
  { header: 'Check out', value: (r: ReportingRecord) => r.checkOut, align: true },
  { header: 'Worked', value: (r: ReportingRecord) => r.workedTime, align: true },
  { header: 'Overtime', value: (r: ReportingRecord) => r.extraTime, align: true },
  { header: 'Late sitting', value: (r: ReportingRecord) => r.lateSitting, align: true },
  { header: 'Early sitting', value: (r: ReportingRecord) => r.earlySitting, align: true },
  { header: 'Acceptable', value: (r: ReportingRecord) => r.acceptableTime, align: true },
] as const;

interface OfficerGroup {
  bioId: string;
  name: string;
  designation: string;
  siteName: string;
  days: ReportingRecord[];
  totals: { worked: string; overtime: string; late: string; early: string; acceptable: string };
}

/** Group the flat rows into one block per officer, with their totals. */
function groupByOfficer(records: ReportingRecord[]): OfficerGroup[] {
  const groups = new Map<string, ReportingRecord[]>();
  for (const record of records) {
    const list = groups.get(record.bioId) ?? [];
    list.push(record);
    groups.set(record.bioId, list);
  }

  return [...groups.values()].map((days) => {
    const first = days[0];
    return {
      bioId: first.bioId,
      name: first.employeeName,
      designation: first.designation,
      siteName: first.siteName,
      days,
      totals: {
        worked: sumDurations(days.map((d) => d.workedTime)),
        overtime: sumDurations(days.map((d) => d.extraTime)),
        late: sumDurations(days.map((d) => d.lateSitting)),
        early: sumDurations(days.map((d) => d.earlySitting)),
        acceptable: sumDurations(days.map((d) => d.acceptableTime)),
      },
    };
  });
}

export default function ReportingPage() {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [month, setMonth] = React.useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = React.useState('');
  const debouncedEmployeeSearch = useDebounce(employeeSearch);

  const employeesQuery = useQuery({
    queryKey: queryKeys.reportingEmployees(),
    queryFn: listReportingEmployees,
  });
  const monthsQuery = useQuery({ queryKey: queryKeys.reportingMonths(), queryFn: listReportingMonths });

  // Default to the most recent month so a report is always a sensible size.
  React.useEffect(() => {
    if (month === null && monthsQuery.data?.length) setMonth(monthsQuery.data[0]);
  }, [month, monthsQuery.data]);

  const filters = React.useMemo(
    () => ({
      employeeIds: selected,
      month: !month || month === ALL_MONTHS ? undefined : month,
    }),
    [selected, month],
  );

  const reportingQuery = useQuery({
    queryKey: queryKeys.reporting(filters),
    queryFn: () => listReporting(filters),
    placeholderData: (prev) => prev,
    enabled: selected.length > 0,
  });

  const employees = employeesQuery.data ?? [];
  const visibleEmployees = employees.filter((e) =>
    `${e.name} ${e.bioId} ${e.siteName} ${e.designation}`
      .toLowerCase()
      .includes(debouncedEmployeeSearch.trim().toLowerCase()),
  );

  const records = React.useMemo(() => reportingQuery.data ?? [], [reportingQuery.data]);
  const groups = React.useMemo(() => groupByOfficer(records), [records]);
  const periodLabel = !month || month === ALL_MONTHS ? 'All dates' : monthLabel(month);

  /*
   * On screen the most recently picked officer comes first, so a new selection
   * appears at the top instead of being buried under the previous ones.
   */
  const displayGroups = React.useMemo(() => {
    const pickedAt = new Map(selected.map((bioId, index) => [bioId, index]));
    return [...groups].sort((a, b) => (pickedAt.get(b.bioId) ?? -1) - (pickedAt.get(a.bioId) ?? -1));
  }, [groups, selected]);

  /*
   * The downloaded report ignores click order and always runs alphabetically,
   * so the same selection always produces the same file.
   */
  const exportGroups = React.useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  );

  function toggleEmployee(bioId: string, checked: boolean) {
    setSelected((prev) => (checked ? [...prev, bioId] : prev.filter((id) => id !== bioId)));
  }

  /*
   * Export as a sectioned report: one heading per officer, their days beneath
   * it, then a totals line — so a name never repeats down a column.
   */
  function handleExport() {
    const rows: unknown[][] = [
      ['NHA ETTM — Attendance Report'],
      ['Period', periodLabel],
      ['Generated', new Date().toLocaleDateString('en-GB')],
      [],
    ];

    for (const group of exportGroups) {
      rows.push([group.name]);
      rows.push(['Bio ID', group.bioId, 'Designation', group.designation, 'Site', group.siteName]);
      rows.push(DAY_COLUMNS.map((c) => c.header));
      for (const day of group.days) {
        rows.push(
          DAY_COLUMNS.map((c) => ('csv' in c && c.csv ? c.csv(day) : c.value(day))),
        );
      }
      rows.push([
        'Total',
        `${group.days.length} day${group.days.length === 1 ? '' : 's'}`,
        '',
        '',
        group.totals.worked,
        group.totals.overtime,
        group.totals.late,
        group.totals.early,
        group.totals.acceptable,
      ]);
      rows.push([]);
    }

    const who =
      exportGroups.length === 1
        ? exportGroups[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        : `${exportGroups.length}-officers`;
    const when = !month || month === ALL_MONTHS ? 'all-dates' : month;
    downloadCsv(`nha-ettm-report-${who}-${when}.csv`, toCsvRows(rows));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reporting"
        description="Pick the officers and the month, then review or download their day-by-day attendance."
        actions={
          <Button size="sm" onClick={handleExport} disabled={groups.length === 0} className="gap-1.5">
            <Download className="h-4 w-4" />
            Download report
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Officers
                {selected.length > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {selected.length} selected
                  </span>
                )}
              </Label>
              {selected.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected([])}
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <SearchInput value={employeeSearch} onChange={setEmployeeSearch} placeholder="Find an officer…" />

            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
              {employeesQuery.isLoading && <p className="p-1 text-xs text-muted-foreground">Loading…</p>}
              {!employeesQuery.isLoading && visibleEmployees.length === 0 && (
                <p className="p-1 text-xs text-muted-foreground">No officers found.</p>
              )}
              {visibleEmployees.map((employee) => (
                <label
                  key={employee.bioId}
                  className="flex cursor-pointer items-start gap-2 rounded px-1 py-1 hover:bg-muted/50"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.includes(employee.bioId)}
                    onCheckedChange={(checked) => toggleEmployee(employee.bioId, checked === true)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{employee.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {employee.designation} &middot; {employee.siteName} &middot; {employee.bioId}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Month</Label>
                <Select value={month ?? ALL_MONTHS} onValueChange={setMonth}>
                  <SelectTrigger aria-label="Select report month">
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_MONTHS}>All dates</SelectItem>
                    {monthsQuery.data?.map((m) => (
                      <SelectItem key={m} value={m}>
                        {monthLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Report covers</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm">
                  {selected.length === 0 ? (
                    <span className="text-muted-foreground">Select at least one officer</span>
                  ) : (
                    <span>
                      <span className="font-medium">{groups.length}</span> officer
                      {groups.length === 1 ? '' : 's'} &middot;{' '}
                      <span className="font-medium">{records.length.toLocaleString()}</span> day
                      {records.length === 1 ? '' : 's'} &middot; {periodLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((bioId) => {
                  const employee = employees.find((e) => e.bioId === bioId);
                  return (
                    <Badge key={bioId} variant="secondary" className="gap-1 pr-1">
                      {employee?.name ?? bioId}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full p-0 hover:bg-transparent"
                        onClick={() => toggleEmployee(bioId, false)}
                        aria-label={`Remove ${employee?.name ?? bioId}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected.length === 0 && (
        <EmptyState
          icon={Users}
          title="Select officers to build a report"
          description="Choose one or more officers on the left, pick a month, then review or download their day-by-day attendance."
        />
      )}

      {selected.length > 0 && reportingQuery.isError && (
        <ErrorState message="Could not load the report." onRetry={() => reportingQuery.refetch()} />
      )}

      {selected.length > 0 && reportingQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {selected.length > 0 && !reportingQuery.isLoading && !reportingQuery.isError && groups.length === 0 && (
        <EmptyState
          icon={FileSpreadsheet}
          title="No attendance in this period"
          description="These officers have no recorded days for the selected month. Try another month."
        />
      )}

      {/* One block per officer: their name once as a heading, their days below. */}
      {displayGroups.map((group) => (
        <Card key={group.bioId} className="overflow-hidden">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b bg-muted/30 px-4 py-3">
            <div>
              <h3 className="text-base font-semibold">{group.name}</h3>
              <p className="text-xs text-muted-foreground">
                {group.designation} &middot; {group.siteName} &middot; Bio ID {group.bioId}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {periodLabel} &middot; {group.days.length} day{group.days.length === 1 ? '' : 's'} &middot; worked{' '}
              <span className="font-medium text-foreground tabular-nums">{group.totals.worked}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/20">
                  {DAY_COLUMNS.map((col) => (
                    <th
                      key={col.header}
                      scope="col"
                      className={`whitespace-nowrap border-b px-4 py-2 text-xs font-semibold text-muted-foreground ${
                        'align' in col && col.align ? 'text-right' : 'text-left'
                      }`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.days.map((day, index) => (
                  <tr key={day.date} className={index % 2 ? 'bg-muted/10' : undefined}>
                    {DAY_COLUMNS.map((col) => {
                      const value = String(col.value(day) ?? '');
                      return (
                        <td
                          key={col.header}
                          className={`whitespace-nowrap border-b border-border/50 px-4 py-2 ${
                            'align' in col && col.align ? 'text-right tabular-nums' : ''
                          }`}
                        >
                          {value || <span className="text-muted-foreground">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-muted/40 font-medium">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {group.days.length} day{group.days.length === 1 ? '' : 's'}
                  </td>
                  <td />
                  <td />
                  <td className="px-4 py-2 text-right tabular-nums">{group.totals.worked}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{group.totals.overtime}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{group.totals.late}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{group.totals.early}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{group.totals.acceptable}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
