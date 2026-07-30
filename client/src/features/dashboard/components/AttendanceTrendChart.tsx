import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Distinct employees who checked in on each of the most recent days.
export default function AttendanceTrendChart({
  data,
}: {
  data: { date: string; present: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    // "2026-07-23" -> "23 Jul"
    label: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="hsl(var(--muted-foreground))"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value} employees`, 'Present']}
        />
        <Area
          type="monotone"
          dataKey="present"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#attendanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
