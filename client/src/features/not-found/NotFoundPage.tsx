import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Compass className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-semibold">404</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We couldn&apos;t find the page you were looking for.
        </p>
      </div>
      <Button asChild size="sm">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
