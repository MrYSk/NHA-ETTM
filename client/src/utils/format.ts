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

export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}
