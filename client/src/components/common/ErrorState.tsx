import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-1 gap-1.5">
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
}
