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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-4">
      <p className="text-sm text-slate-500">{data?.payload?.date}</p>
      <p className="font-semibold text-violet-600">
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
      <div className="text-center py-14 text-slate-500">
        <p className="font-medium mb-2">Completa tareas para ver tu progreso</p>
        <p className="text-sm">Las tareas completadas aparecerán aquí como gráfico</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-6">
        Tareas completadas (últimos 7 días)
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#64748b', fontSize: 13 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            dy={10}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#64748b', fontSize: 13 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
          <Bar
            dataKey="count"
            fill="#8b5cf6"
            radius={[8, 8, 0, 0]}
            name="Completadas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}