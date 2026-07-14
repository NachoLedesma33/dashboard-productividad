import type { Task, Habit, CompletionLogEntry } from '@/types';
import { getDayCounts } from '@/utils/analytics/insightsEngine';

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function generateReport(
  _tasks: Task[],
  habits: Habit[],
  logs: CompletionLogEntry[],
): string {
  const today = new Date();
  const weekNumber = getWeekNumber(today);

  // Total completions this week (using same dual-source logic as insights)
  const dayCounts = getDayCounts(logs);
  const totalCompletions = dayCounts.reduce((a, b) => a + b, 0);

  // Habits %
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

  // Best / worst day
  const bestDayCount = Math.max(...dayCounts);
  const worstDayCount = Math.min(...dayCounts);
  const bestDay = DAY_NAMES[dayCounts.indexOf(bestDayCount)];
  const worstDay = DAY_NAMES[dayCounts.indexOf(worstDayCount)];

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

  const breakdown = dayCounts.map((c, i) => `${DAY_NAMES[i]}: ${c}`).join(' · ');

  return [
    `🏆 Reporte de Productividad - Semana ${weekNumber}`,
    '',
    `Completaste ${totalCompletions} tareas esta semana`,
    `(desglose: ${breakdown})`,
    `Hábitos: ${habitsRate}% de cumplimiento`,
    `Mejor día: ${bestDay} (${bestDayCount} tareas) · Día más bajo: ${worstDay} (${worstDayCount} tareas)`,
    '',
    bestDayCount > 0
      ? '✅ Buena semana! Mantené el ritmo.'
      : '📉 Semana baja. Revisá qué pasó y arrancá de nuevo.',
    '',
    'Top recomendación:',
    topRec,
  ].join('\n');
}
