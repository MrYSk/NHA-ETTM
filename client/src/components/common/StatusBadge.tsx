import { Badge } from '@/components/ui/badge';
import { titleCase } from '@/utils/format';

const SUCCESS = new Set(['active', 'present', 'approved', 'completed']);
const WARNING = new Set(['pending', 'late', 'half-day', 'blocked', 'suspended']);
const DESTRUCTIVE = new Set(['inactive', 'absent', 'disapproved']);

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  const key = status.toLowerCase();
  const variant = SUCCESS.has(key) ? 'success' : WARNING.has(key) ? 'warning' : DESTRUCTIVE.has(key) ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{titleCase(status)}</Badge>;
}
