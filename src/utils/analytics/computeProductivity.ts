import {
  format,
  subDays,
  startOfDay,
  isSameDay,
  getDay,
} from 'date-fns';
import type { Task } from '@/types';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function getWeeklyData(tasks: Task[]): { day: string; completions: number }[] {
  const today = new Date();
  const data: { day: string; completions: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dayStart = startOfDay(date);

    const completions = tasks.filter((task) => {
      if (!task.completed || !task.completedAt) return false;
      const completedDate = startOfDay(new Date(task.completedAt));
      return isSameDay(completedDate, dayStart);
    }).length;

    data.push({
      day: format(date, 'EEE'),
      completions,
    });
  }

  return data;
}

export function getProductivityByHour(
  tasks: Task[]
): { hour: number; count: number }[] {
  const hourCounts: number[] = new Array(24).fill(0);

  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt) return;
    const completedDate = new Date(task.completedAt);
    hourCounts[completedDate.getHours()]++;
  });

  return hourCounts.map((count, hour) => ({ hour, count }));
}

export function getBestDay(tasks: Task[]): string {
  const dayCounts: number[] = new Array(7).fill(0);

  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt) return;
    const completedDate = new Date(task.completedAt);
    const dayIndex = getDay(completedDate);
    dayCounts[dayIndex]++;
  });

  const maxCount = Math.max(...dayCounts);
  if (maxCount === 0) return 'Ninguno';

  const bestDayIndex = dayCounts.indexOf(maxCount);
  return DAY_NAMES[bestDayIndex];
}