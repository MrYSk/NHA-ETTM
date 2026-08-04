import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listEmployees } from '@/api/employees.service';
import { listSites, listDesignations } from '@/api/sites.service';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryClient';
import { usePermissions } from '@/hooks/usePermissions';
import { initials } from '@/utils/format';
import { EmployeeDetailDrawer } from './components/EmployeeDetailDrawer';
import type { Employee } from '@/types';

const PAGE_SIZE = 10;
const ALL = '__all__';

export default function EmployeesPage() {
  const [search, setSearch] = React.useState('');
  const [siteId, setSiteId] = React.useState<string>(ALL);
  const [designation, setDesignation] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<Employee['id'] | null>(null);

  const debouncedSearch = useDebounce(search);
  const { isScoped } = usePermissions();

  React.useEffect(() => setPage(1), [debouncedSearch, siteId, designation]);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    siteId: siteId === ALL ? undefined : siteId,
    designation: designation === ALL ? undefined : designation,
  };

  const employeesQuery = useQuery({
    queryKey: queryKeys.employees(filters),
    queryFn: () => listEmployees(filters),
    placeholderData: (prev) => prev,
  });

  const sitesQuery = useQuery({ queryKey: queryKeys.sites(), queryFn: () => listSites() });
  const designationsQuery = useQuery({ queryKey: queryKeys.designations(), queryFn: listDesignations });

  const employees = employeesQuery.data?.items ?? [];
  const isEmpty = !employeesQuery.isLoading && !employeesQuery.isError && employees.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employees"
        description={
          isScoped
            ? 'The employees you are responsible for.'
            : 'Search and manage employee records across every ETTM site.'
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, or email…" className="sm:w-72" />

          <Select value={siteId} onValueChange={setSiteId}>
            <SelectTrigger className="sm:w-48">
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

          <Select value={designation} onValueChange={setDesignation}>
            <SelectTrigger className="sm:w-52">
              <SelectValue placeholder="All designations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All designations</SelectItem>
              {designationsQuery.data?.map((d) => (
                <SelectItem key={d.id} value={d.title ?? ''}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {employeesQuery.isError && (
        <ErrorState message="Could not load employees." onRetry={() => employeesQuery.refetch()} />
      )}

      {!employeesQuery.isError && employeesQuery.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {isEmpty && (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting your search or filters."
        />
      )}

      {!employeesQuery.isLoading && !employeesQuery.isError && employees.length > 0 && (
        <Card>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(employee.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{employee.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{employee.employeeCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{employee.designation}</TableCell>
                    <TableCell className="text-sm">{employee.siteName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{employee.phone}</TableCell>
                    <TableCell>
                      <StatusBadge status={employee.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {employees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedId(employee.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{initials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{employee.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {employee.designation} &middot; {employee.siteName}
                  </p>
                </div>
                <StatusBadge status={employee.status} />
              </button>
            ))}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={employeesQuery.data?.total ?? 0}
            onPageChange={setPage}
          />
        </Card>
      )}

      <EmployeeDetailDrawer employeeId={selectedId} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
