import type { CompletionLogEntry } from '@/types';

export interface WeeklyPrediction {
  predictedTasks: number;
  trendDirection: 'up' | 'down' | 'stable';
  bestDay: { day: string; score: number };
  worstDay: { day: string; score: number };
  insight: string;
  weeklyCounts: number[];
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function predictWeek(logs: CompletionLogEntry[]): WeeklyPrediction {
  const weeks = new Map<string, number>();
  for (const log of logs) {
    const key = getWeekStart(new Date(log.dateKey));
    weeks.set(key, (weeks.get(key) || 0) + 1);
  }

  const sortedWeeks = [...weeks.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-4)
    .map(([, count]) => count);

  const weeklyCounts = sortedWeeks.length > 0 ? sortedWeeks : [0];

  const weights = weeklyCounts.length === 4
    ? [0.1, 0.2, 0.3, 0.4]
    : weeklyCounts.map((_, i) => (i + 1) / weeklyCounts.reduce((s, _, j) => s + j + 1, 0));

  const predictedTasks = Math.round(
    weeklyCounts.reduce((sum, w, i) => sum + w * weights[i], 0)
  );

  const slope = linearRegressionSlope(weeklyCounts);
  const trendDirection = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable';

  const dayScores = [0, 0, 0, 0, 0, 0, 0];
  for (const log of logs) {
    const day = new Date(log.dateKey).getDay();
    dayScores[day]++;
  }

  const maxScore = Math.max(...dayScores);
  const minScore = Math.min(...dayScores);
  const bestIdx = dayScores.indexOf(maxScore);
  const worstIdx = dayScores.indexOf(minScore);

  const insight = trendDirection === 'up'
    ? 'Vas en ascenso! Mejorando semana a semana.'
    : trendDirection === 'down'
    ? 'Últimas semanas bajaron. Revisá si hay algo externo afectando.'
    : 'Manteniendo ritmo constante. Buen trabajo!';

  return {
    predictedTasks,
    trendDirection,
    bestDay: { day: DAY_NAMES[bestIdx], score: maxScore },
    worstDay: { day: DAY_NAMES[worstIdx], score: minScore },
    insight,
    weeklyCounts,
  };
}
