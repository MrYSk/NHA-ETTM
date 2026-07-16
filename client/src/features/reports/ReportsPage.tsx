import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileBarChart, FileText } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { listReports } from '@/api/reports.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { formatDate } from '@/utils/format';
import type { Report } from '@/types';

export default function ReportsPage() {
  const [search, setSearch] = React.useState('');
  const [previewReport, setPreviewReport] = React.useState<Report | null>(null);
  const debouncedSearch = useDebounce(search);

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports({ search: debouncedSearch }),
    queryFn: () => listReports({ search: debouncedSearch }),
  });

  const reports = reportsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Generated attendance, leave, staffing, and schedule reports." />

      <SearchInput value={search} onChange={setSearch} placeholder="Search reports by title or type…" className="sm:w-80" />

      {reportsQuery.isError && <ErrorState message="Could not load reports." onRetry={() => reportsQuery.refetch()} />}

      {!reportsQuery.isError && reportsQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!reportsQuery.isLoading && !reportsQuery.isError && reports.length === 0 && (
        <EmptyState icon={FileBarChart} title="No reports found" description="Try a different search term." />
      )}

      {!reportsQuery.isLoading && !reportsQuery.isError && reports.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <Badge variant="secondary">{report.type}</Badge>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold leading-snug">{report.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{report.dateRange}</p>
                  <p className="text-xs text-muted-foreground">{report.siteName}</p>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">Generated {formatDate(report.generatedOn)}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPreviewReport(report)}>
                      Preview
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button variant="ghost" size="icon" disabled>
                            <Download className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Download is coming soon</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!previewReport} onOpenChange={(open) => !open && setPreviewReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewReport?.title}</DialogTitle>
            <DialogDescription>
              {previewReport?.type} report &middot; {previewReport?.dateRange}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Report preview rendering is not yet wired to a real data export. This is a placeholder until the
            backend report payload format is confirmed.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
