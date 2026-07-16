import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendTone?: 'success' | 'warning' | 'destructive' | 'neutral';
}

const TONE_CLASS: Record<NonNullable<StatCardProps['trendTone']>, string> = {
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  neutral: 'text-muted-foreground',
};

export function StatCard({ label, value, icon: Icon, trend, trendTone = 'neutral' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
          {trend && <p className={cn('mt-1 text-xs font-medium', TONE_CLASS[trendTone])}>{trend}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="h-4.5 w-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
