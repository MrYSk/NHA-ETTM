import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlySummary } from '@/types';
import { parseDurationHours } from '@/utils/format';

// Total logged hours per employee, aggregated from the real monthly summary
// rows (one row per employee per schedule period).
export default function AttendanceTrendChart({ data }: { data: MonthlySummary[] }) {
  const hoursByEmployee = new Map<string, number>();
  for (const row of data) {
    const name = row.employeeName ?? '—';
    hoursByEmployee.set(name, (hoursByEmployee.get(name) ?? 0) + parseDurationHours(row.totalTime));
  }

  const chartData = Array.from(hoursByEmployee, ([name, hours]) => ({
    name: name.split(' ')[0],
    fullName: name,
    hours: Math.round(hours * 10) / 10,
  }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" unit="h" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number, _name, item) => [
            `${value} hours`,
            (item?.payload as { fullName?: string })?.fullName ?? 'Logged',
          ]}
        />
        <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
