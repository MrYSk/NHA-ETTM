import * as React from 'react';
import { useRouteError } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/*
 * Router-level error element. Without one, any error thrown while rendering a
 * route makes React Router show its raw "Unexpected Application Error!" screen
 * (a minified React error). This replaces that with a friendly, recoverable UI.
 *
 * It also transparently recovers from stale dynamic-import (lazy chunk)
 * failures: after a new deployment, a browser holding the old index.html may
 * request a code-split chunk whose hashed filename no longer exists, which
 * rejects the import and throws here. A one-time reload fetches the current
 * assets and fixes it.
 */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
}

const RELOAD_FLAG = 'nha_chunk_reloaded';

export function RouteErrorPage() {
  const error = useRouteError();

  React.useEffect(() => {
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      // Guard against a reload loop: only auto-reload once per session.
      sessionStorage.setItem(RELOAD_FLAG, '1');
      window.location.reload();
    }
  }, [error]);

  if (import.meta.env.DEV) {
    console.error('[route-error]', error);
  }

  const chunkError = isChunkLoadError(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium">
          {chunkError ? 'A new version is available' : 'This page ran into a problem'}
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {chunkError
            ? 'Reloading to get the latest version…'
            : 'Something went wrong while loading this page. Reloading usually fixes it.'}
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          sessionStorage.removeItem(RELOAD_FLAG);
          window.location.assign('/');
        }}
      >
        Reload app
      </Button>
    </div>
  );
}
