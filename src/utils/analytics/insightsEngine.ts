import { getDay, getHours, differenceInDays } from 'date-fns';
import type { Task, Habit } from '@/types';

export interface Insight {
  id: string;
  type: 'morning' | 'evening' | 'bestDay' | 'priority' | 'streak';
  message: string;
  emoji: string;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getMorningProductivity(tasks: Task[]): number {
  const completed = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const hour = getHours(new Date(t.completedAt));
    return hour >= 6 && hour < 12;
  });
  return completed.length;
}

function getEveningProductivity(tasks: Task[]): number {
  const completed = tasks.filter((t) => {
    if (!t.completed || !t.completedAt) return false;
    const hour = getHours(new Date(t.completedAt));
    return hour >= 18 && hour < 24;
  });
  return completed.length;
}

function getBestDayOfWeek(tasks: Task[]): string | null {
  const dayCounts: number[] = new Array(7).fill(0);

  tasks.forEach((task) => {
    if (!task.completed || !task.completedAt) return;
    const dayIndex = getDay(new Date(task.completedAt));
    dayCounts[dayIndex]++;
  });

  const maxCount = Math.max(...dayCounts);
  if (maxCount === 0) return null;

  const bestDayIndex = dayCounts.indexOf(maxCount);
  return DAY_NAMES[bestDayIndex];
}

function getHighPriorityDelay(tasks: Task[]): boolean {
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.completed);

  if (highPriorityTasks.length === 0) return false;

  for (const task of highPriorityTasks) {
    const daysDelay = differenceInDays(
      new Date(task.completedAt!),
      new Date(task.createdAt)
    );
    if (daysDelay > 2) return true;
  }

  return false;
}

function getBestHabitStreak(habits: Habit[]): { name: string; streak: number } | null {
  let best: { name: string; streak: number } | null = null;

  for (const habit of habits) {
    if (habit.completionDates.length < 2) continue;

    const sorted = [...habit.completionDates]
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);

    let streak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i] - sorted[i - 1];
      if (diff === 864000000) {
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    if (!best || streak > best.streak) {
      best = { name: habit.name, streak };
    }
  }

  return best;
}

export function generateInsights(tasks: Task[], habits: Habit[]): Insight[] {
  const insights: Insight[] = [];
  const totalCompleted = tasks.filter((t) => t.completed).length;

  if (totalCompleted > 0) {
    const morningCount = getMorningProductivity(tasks);
    const eveningCount = getEveningProductivity(tasks);

    if (morningCount / totalCompleted > 0.6) {
      insights.push({
        id: 'morning',
        type: 'morning',
        message: 'Rendís más a la mañana',
        emoji: '🌅',
      });
    } else if (eveningCount / totalCompleted > 0.6) {
      insights.push({
        id: 'evening',
        type: 'evening',
        message: 'Sos más productivo por la noche',
        emoji: '🌙',
      });
    }
  }

  const bestDay = getBestDayOfWeek(tasks);
  if (bestDay && totalCompleted >= 3) {
    insights.push({
      id: 'bestDay',
      type: 'bestDay',
      message: `Tu mejor día es ${bestDay}`,
      emoji: '📈',
    });
  }

  if (getHighPriorityDelay(tasks)) {
    insights.push({
      id: 'priority',
      type: 'priority',
      message: 'Las tareas importantes te cuestan más',
      emoji: '⚠️',
    });
  }

  const bestStreak = getBestHabitStreak(habits);
  if (bestStreak && bestStreak.streak > 5) {
    insights.push({
      id: 'streak',
      type: 'streak',
      message: `Excelente racha en ${bestStreak.name}`,
      emoji: '🔥',
    });
  }

  return insights.slice(0, 3);
}