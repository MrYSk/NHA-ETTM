import * as React from 'react';
import { Route } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * The National Highway Authority logo.
 *
 * Two assets are used, because the official artwork includes the full wordmark
 * ("National Highway Authority" + tagline) which turns into an unreadable
 * smudge below ~100px:
 *   - "emblem" (public/nha-emblem.png) — the square sun/road/trees mark, cropped
 *     from the official file. Used for small placements such as the sidebar.
 *   - "full"   (public/nha-logo.png)   — the complete logo, for large brand
 *     moments where the wordmark is legible.
 *
 * Both files have a transparent background, so the mark sits directly on
 * whatever surface it is placed on and looks correct in light and dark mode
 * alike — no white box on the dark sidebar or dark sign-in card. Pass
 * `backdrop` to put it on an explicit white chip instead (rarely needed).
 *
 * If the file is missing, a neutral mark is shown so the layout never breaks.
 */
export function Logo({
  className,
  variant = 'emblem',
  backdrop = false,
  alt = 'National Highway Authority',
}: {
  className?: string;
  variant?: 'emblem' | 'full';
  backdrop?: boolean;
  alt?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-md bg-white/10 text-current',
          className,
        )}
      >
        <Route className="h-1/2 w-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden',
        backdrop && 'rounded-md bg-white shadow-sm ring-1 ring-black/5',
        backdrop && (variant === 'emblem' ? 'p-0.5' : 'p-1.5'),
        className,
      )}
    >
      <img
        src={variant === 'emblem' ? '/nha-emblem.png' : '/nha-logo.png'}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-full w-full object-contain"
      />
    </div>
  );
}
