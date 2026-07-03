import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  subDays,
} from 'date-fns';
import type { CompletionLogEntry } from '@/types';

interface ProductivityChartProps {
  completionLog: CompletionLogEntry[];
}

interface ChartData {
  day: string;
  count: number;
  date: string;
}

function generateChartData(completionLog: CompletionLogEntry[]): ChartData[] {
  const today = new Date();
  const data: ChartData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');

    const completedCount = completionLog.filter(
      (entry) => entry.dateKey === dateKey
    ).length;

    data.push({
      day: format(date, 'EEE'),
      count: completedCount,
      date: format(date, 'dd MMM yyyy'),
    });
  }

  return data;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: ChartData }> }) {
  if (!active || !payload?.length) return null;

  const data = payload[0];

  return (
    <div className="bg-surface border border-border rounded-lg shadow-xl p-4">
      <p className="text-sm text-text-secondary">{data?.payload?.date}</p>
      <p className="font-semibold text-accent">
        {data?.value} tarea{data?.value !== 1 ? 's' : ''} completada{data?.value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export function ProductivityChart({ completionLog }: ProductivityChartProps) {
  const chartData = generateChartData(completionLog);
  const totalCompleted = chartData.reduce((acc, d) => acc + d.count, 0);

  if (totalCompleted === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-text-muted">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 64 64" fill="none">
          <rect x="4" y="4" width="56" height="56" rx="8" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="text-border" />
          <rect x="12" y="20" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="1" className="text-accent/20" />
          <rect x="20" y="28" width="8" height="12" rx="2" className="fill-accent/10" />
          <rect x="32" y="24" width="8" height="16" rx="2" className="fill-accent/15" />
        </svg>
        <p className="font-medium mb-1">Completa tareas para ver tu progreso</p>
        <p className="text-sm">Las tareas completadas aparecerán aquí como gráfico</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-text-primary mb-6">
        Tareas completadas (últimos 7 días)
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fill: '#94A0B8', fontSize: 13 }}
            axisLine={{ stroke: '#242C3D' }}
            tickLine={false}
            dy={10}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#94A0B8', fontSize: 13 }}
            axisLine={{ stroke: '#242C3D' }}
            tickLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }} />
          <Bar
            dataKey="count"
            fill="url(#barGradient)"
            radius={[8, 8, 0, 0]}
            name="Completadas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}