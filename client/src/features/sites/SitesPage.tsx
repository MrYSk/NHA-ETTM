import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { listSites } from '@/api/sites.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { SiteDetailDrawer } from './components/SiteDetailDrawer';
import type { Site } from '@/types';

export default function SitesPage() {
  const [search, setSearch] = React.useState('');
  const [selectedSite, setSelectedSite] = React.useState<Site | null>(null);
  const debouncedSearch = useDebounce(search);

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(debouncedSearch), queryFn: () => listSites(debouncedSearch) });
  const sites = sitesQuery.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="Sites" description="ETTM toll plazas and interchanges across the network." />

      <SearchInput value={search} onChange={setSearch} placeholder="Search sites by name, code, or location…" className="sm:w-80" />

      {sitesQuery.isError && <ErrorState message="Could not load sites." onRetry={() => sitesQuery.refetch()} />}

      {!sitesQuery.isError && sitesQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!sitesQuery.isLoading && !sitesQuery.isError && sites.length === 0 && (
        <EmptyState icon={Building2} title="No sites found" description="Try a different search term." />
      )}

      {!sitesQuery.isLoading && !sitesQuery.isError && sites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card
              key={site.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setSelectedSite(site)}
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Building2 className="h-4.5 w-4.5" />
                  </div>
                  <StatusBadge status={site.status} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{site.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {site.code} &middot; {site.location}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{site.employeeCount} employees</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SiteDetailDrawer site={selectedSite} onOpenChange={(open) => !open && setSelectedSite(null)} />
    </div>
  );
}
