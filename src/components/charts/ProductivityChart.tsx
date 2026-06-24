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
  startOfDay,
  isSameDay,
} from 'date-fns';
import type { Task } from '@/types';

interface ProductivityChartProps {
  tasks: Task[];
}

interface ChartData {
  day: string;
  count: number;
  date: string;
}

function generateChartData(tasks: Task[]): ChartData[] {
  const today = new Date();
  const data: ChartData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dayStart = startOfDay(date);

    const completedCount = tasks.filter((task) => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = startOfDay(new Date(task.completedAt));
      return isSameDay(completedDate, dayStart);
    }).length;

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

export function ProductivityChart({ tasks }: ProductivityChartProps) {
  const chartData = generateChartData(tasks);
  const totalCompleted = chartData.reduce((acc, d) => acc + d.count, 0);

  if (totalCompleted === 0) {
    return (
      <div className="text-center py-14 text-text-muted">
        <p className="font-medium mb-2">Completa tareas para ver tu progreso</p>
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
            fill="#6366F1"
            radius={[8, 8, 0, 0]}
            name="Completadas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
