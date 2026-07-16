import { useQuery } from '@tanstack/react-query';
import { CircleCheck, CircleAlert, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { checkHealth } from '@/api/health.service';
import { testSsl } from '@/api/reports.service';
import { USE_MOCK_API, API_BASE_URL } from '@/api/client';
import { queryKeys } from '@/lib/queryClient';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/utils/format';

const APP_VERSION = '1.0.0';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const healthQuery = useQuery({ queryKey: queryKeys.health(), queryFn: checkHealth });
  const sslQuery = useQuery({ queryKey: queryKeys.sslTest(), queryFn: testSsl, enabled: false });

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="System status, environment, and session details." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Backend connectivity</CardTitle>
            <CardDescription>Live status of the local Node.js proxy and the upstream HRIS API.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              label="Proxy health"
              status={healthQuery.isLoading ? 'loading' : healthQuery.data?.status === 'ok' ? 'ok' : 'error'}
            />
            <StatusRow label="API mode" value={USE_MOCK_API ? 'Mock API' : 'Live API'} />
            <StatusRow label="API base URL" value={API_BASE_URL} />
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SSL test</p>
                <p className="text-xs text-muted-foreground">Runs the backend&apos;s ssl_test route.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => sslQuery.refetch()} disabled={sslQuery.isFetching}>
                {sslQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                Run test
              </Button>
            </div>
            {sslQuery.data && (
              <p className={`text-xs ${sslQuery.data.ok ? 'text-success' : 'text-destructive'}`}>
                {sslQuery.data.message}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Build and runtime information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Frontend version" value={APP_VERSION} />
            <StatusRow label="Environment" value={import.meta.env.MODE} />
            <StatusRow label="Theme" value={theme === 'dark' ? 'Dark' : 'Light'} />
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
                Light
              </Button>
              <Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Your current signed-in session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Signed in as" value={user?.username ?? '—'} />
            <StatusRow label="Role" value={user?.role ?? '—'} />
            <StatusRow label="Site" value={user?.siteName ?? '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Profile editing is not yet wired to a real API.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials(user?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <Button size="sm" variant="outline" disabled className="mt-2">
                Edit profile (coming soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value?: string;
  status?: 'ok' | 'error' | 'loading';
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      {status ? (
        <span className="flex items-center gap-1.5 font-medium">
          {status === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {status === 'ok' && <CircleCheck className="h-3.5 w-3.5 text-success" />}
          {status === 'error' && <CircleAlert className="h-3.5 w-3.5 text-destructive" />}
          {status === 'loading' ? 'Checking…' : status === 'ok' ? 'Healthy' : 'Unreachable'}
        </span>
      ) : (
        <span className="font-medium">{value}</span>
      )}
    </div>
  );
}
