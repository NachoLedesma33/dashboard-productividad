import type { Habit, CompletionLogEntry } from '@/types';

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getDayFromDateKey(dateKey: string): number {
  return new Date(dateKey + 'T12:00:00').getDay();
}

function getWeekDayScores(logs: CompletionLogEntry[]): number[] {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

  const logScores = [0, 0, 0, 0, 0, 0, 0];
  const weekLogs = logs.filter(l => l.dateKey >= startKey);
  for (const log of weekLogs) {
    const day = getDayFromDateKey(log.dateKey);
    logScores[day]++;
  }

  const localScores = [0, 0, 0, 0, 0, 0, 0];
  try {
    const localCounts = JSON.parse(localStorage.getItem('dailyCounts') || '{}');
    Object.entries(localCounts).forEach(([dateKey, count]) => {
      if (dateKey >= startKey) {
        const day = getDayFromDateKey(dateKey);
        localScores[day] += count as number;
      }
    });
  } catch { /* ignore */ }

  const dayScores = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 7; i++) {
    dayScores[i] = Math.max(logScores[i], localScores[i]);
  }
  return dayScores;
}

export function generateReport(
  habits: Habit[],
  logs: CompletionLogEntry[],
): string {
  const today = new Date();
  const weekNumber = getWeekNumber(today);
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const dayScores = getWeekDayScores(logs);
  const completedTasks = dayScores.reduce((a, b) => a + b, 0);
  const bestDay = dayNames[dayScores.indexOf(Math.max(...dayScores))];
  const worstDay = dayNames[dayScores.indexOf(Math.min(...dayScores))];
  const bestDayCount = Math.max(...dayScores);
  const worstDayCount = Math.min(...dayScores);

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

  const habitDays = new Set<string>();
  for (const h of habits) {
    for (const cd of h.completionDates) {
      const d = new Date(cd);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (key >= startKey) habitDays.add(key);
    }
  }
  const totalHabitDays = habits.length * 7;
  const habitsRate = totalHabitDays > 0 ? Math.round((habitDays.size / totalHabitDays) * 100) : 0;

  const weakHabit = habits.find(h => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    return !h.completionDates.some(cd => {
      const d = new Date(cd);
      d.setHours(0, 0, 0, 0);
      return last7.includes(d.getTime());
    });
  });

  const topRec = weakHabit
    ? `Enfocate en mantener "${weakHabit.name}" consistente esta semana.`
    : habits.length > 0
    ? 'Todos los hábitos van bien! Seguí así.'
    : 'Definí 3 objetivos claros para arrancar la semana.';

  return [
    `🏆 Reporte de Productividad - Semana ${weekNumber}`,
    '',
    `Tareas completadas: ${completedTasks}  |  Hábitos: ${habitsRate}%`,
    `Mejor día: ${bestDay} (${bestDayCount})  |  Día más bajo: ${worstDay} (${worstDayCount})`,
    '',
    completedTasks > 20
      ? '✅ Excelente semana! Mantené este ritmo.'
      : completedTasks > 10
      ? '📊 Buena semana. Seguí así.'
      : '📉 Semana baja. Revisá qué pasó y arrancá de nuevo.',
    '',
    'Recomendación:',
    topRec,
  ].join('\n');
}
