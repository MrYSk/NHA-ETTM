import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getSiteEmployees, getSiteRoles } from '@/api/sites.service';
import { queryKeys } from '@/lib/queryClient';
import { initials } from '@/utils/format';
import type { Site } from '@/types';

interface SiteDetailDrawerProps {
  site: Site | null;
  onOpenChange: (open: boolean) => void;
}

export function SiteDetailDrawer({ site, onOpenChange }: SiteDetailDrawerProps) {
  const employeesQuery = useQuery({
    queryKey: queryKeys.siteEmployees(site?.id),
    queryFn: () => getSiteEmployees(site!.id),
    enabled: !!site,
  });
  const rolesQuery = useQuery({
    queryKey: queryKeys.siteRoles(site?.id),
    queryFn: () => getSiteRoles(site!.id),
    enabled: !!site,
  });

  return (
    <Sheet open={!!site} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{site?.name}</SheetTitle>
          <SheetDescription>
            {site?.code} &middot; {site?.location}
          </SheetDescription>
        </SheetHeader>

        {site && (
          <div className="mt-4 flex items-center gap-2">
            <StatusBadge status={site.status} />
            <Badge variant="secondary">{site.employeeCount} employees</Badge>
          </div>
        )}

        <Separator className="my-5" />

        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-2">
            {employeesQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
            {!employeesQuery.isLoading && employeesQuery.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No employees at this site.</p>
            )}
            {employeesQuery.data?.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials(e.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.designation}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="roles" className="space-y-2">
            {rolesQuery.isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
            {!rolesQuery.isLoading && rolesQuery.data?.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No roles assigned to this site.</p>
            )}
            {rolesQuery.data?.map((r) => (
              <div key={r.id} className="rounded-md border px-3 py-2">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
