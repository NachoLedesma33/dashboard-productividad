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
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600">{data?.payload?.date}</p>
      <p className="font-semibold text-purple-600">
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
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-600 font-medium">Completa tareas para ver tu progreso</p>
        <p className="text-sm text-gray-500 mt-1">
          Las tareas completadas aparecerán aquí como gráfico
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Tareas completadas (últimos 7 días)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }} />
          <Bar
            dataKey="count"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
            name="Completadas"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}