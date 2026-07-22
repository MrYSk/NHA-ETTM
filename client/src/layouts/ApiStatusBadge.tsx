import { useQuery } from '@tanstack/react-query';
import { CircleCheck, CircleAlert, CircleDashed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { checkHealth } from '@/api/health.service';
import { queryKeys } from '@/lib/queryClient';

export function ApiStatusBadge() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.health(),
    queryFn: checkHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const ok = data?.status === 'ok';

  return (
    <div
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:flex',
        isLoading && 'text-muted-foreground',
        !isLoading && ok && 'border-success/30 bg-success/10 text-success',
        !isLoading && !ok && 'border-warning/30 bg-warning/10 text-warning',
      )}
      title="Live API mode"
    >
      {isLoading ? (
        <CircleDashed className="h-3 w-3 animate-spin" />
      ) : ok ? (
        <CircleCheck className="h-3 w-3" />
      ) : (
        <CircleAlert className="h-3 w-3" />
      )}
      {isError || !ok ? 'API unreachable' : 'API online'}
    </div>
  );
}
