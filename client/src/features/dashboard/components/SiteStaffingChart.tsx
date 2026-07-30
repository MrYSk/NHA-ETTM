import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Site } from '@/types';

/*
 * Employees assigned to every site. Rendered as a horizontal bar chart so all
 * site names stay readable, and no site is dropped — a site with no staff still
 * appears (as an empty row), which is itself useful information.
 */
export default function SiteStaffingChart({ data }: { data: Site[] }) {
  const chartData = [...data]
    .map((s) => ({
      name: s.name ?? '—',
      employees: s.employeeCount ?? 0,
    }))
    .sort((a, b) => b.employees - a.employees || a.name.localeCompare(b.name));

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, chartData.length * 26)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={104}
          interval={0}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value} employees`, 'Assigned']}
        />
        <Bar dataKey="employees" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}
