import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlySummary } from '@/types';

export default function AttendanceTrendChart({ data }: { data: MonthlySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="hsl(var(--muted-foreground))" unit="%" />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}%`, 'Attendance rate']}
        />
        <Area
          type="monotone"
          dataKey="attendanceRate"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#attendanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
