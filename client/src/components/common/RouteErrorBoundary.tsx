import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends React.Component<{ children: React.ReactNode }, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[route-error]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium">This page ran into a problem</p>
            <p className="mt-1 text-sm text-muted-foreground">Reloading the page usually fixes this.</p>
          </div>
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
