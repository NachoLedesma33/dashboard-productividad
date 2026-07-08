import type { Task, Habit, CompletionLogEntry } from '@/types';

function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export function generateReport(
  tasks: Task[],
  habits: Habit[],
  logs: CompletionLogEntry[],
): string {
  const today = new Date();
  const weekNumber = getWeekNumber(today);

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

  const weekLogs = logs.filter(l => l.dateKey >= startKey);
  const completedTasks = weekLogs.length;
  const totalTasks = tasks.length;
  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const dayScores = [0, 0, 0, 0, 0, 0, 0];
  for (const log of weekLogs) {
    const day = new Date(log.dateKey).getDay();
    dayScores[day]++;
  }
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const bestDay = dayNames[dayScores.indexOf(Math.max(...dayScores))];
  const worstDay = dayNames[dayScores.indexOf(Math.min(...dayScores))];
  const bestDayCount = Math.max(...dayScores);
  const worstDayCount = Math.min(...dayScores);

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
    'Resumen:',
    `- Tareas: ${completedTasks}/${totalTasks} (${rate}%)`,
    `- Hábitos: ${habitsRate}% de cumplimiento`,
    `- Mejor día: ${bestDay} (${bestDayCount} tareas)`,
    `- Día más bajo: ${worstDay} (${worstDayCount} tareas)`,
    '',
    rate > 50
      ? '✅ Buena semana! Mantené el ritmo.'
      : rate > 20
      ? '📊 Semana aceptable. Probá aumentar el foco.'
      : '📉 Semana baja. Revisá qué pasó y arrancá de nuevo.',
    '',
    'Top recomendación:',
    topRec,
  ].join('\n');
}
