export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// Parse an upstream "HH:MM:SS" (hours can exceed 24, e.g. "179:30:00")
// duration into a decimal number of hours.
export function parseDurationHours(value?: string | null): number {
  if (!value) return 0;
  const [h = '0', m = '0', s = '0'] = value.split(':');
  const hours = Number(h) + Number(m) / 60 + Number(s) / 3600;
  return Number.isFinite(hours) ? hours : 0;
}

/** Parse an "HH:MM:SS" duration into whole seconds. */
export function parseDurationSeconds(value?: string | null): number {
  if (!value) return 0;
  const [h = '0', m = '0', s = '0'] = value.split(':');
  const total = Number(h) * 3600 + Number(m) * 60 + Number(s);
  return Number.isFinite(total) ? total : 0;
}

/** Format seconds back to "HH:MM:SS", letting hours run past 24. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':');
}

/** Sum a list of "HH:MM:SS" durations into a single "HH:MM:SS". */
export function sumDurations(values: (string | undefined)[]): string {
  return formatDuration(values.reduce((total, value) => total + parseDurationSeconds(value), 0));
}

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
