import type { Task, CompletionLogEntry } from '@/types';

export interface ScoredTask {
  task: Task;
  score: number;
  reason: string;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function scoreUrgency(priority: Task['priority']): number {
  if (priority === 'high') return 1.0;
  if (priority === 'medium') return 0.6;
  return 0.3;
}

function scoreConsistency(taskId: string, logs: CompletionLogEntry[]): number {
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));
  const completedToday = logs.some(l => l.taskId === taskId && l.dateKey === today);
  const completedYesterday = logs.some(l => l.taskId === taskId && l.dateKey === yesterday);
  if (completedToday) return 1.0;
  if (completedYesterday) return 0.7;
  return 0.5;
}

function scoreRecurring(task: Task): number {
  return task.recurringDays?.length ? 1.2 : 1.0;
}

export function scoreTask(task: Task, logs: CompletionLogEntry[]): number {
  return (
    scoreUrgency(task.priority) * 0.50 +
    scoreConsistency(task.id, logs) * 0.30 +
    scoreRecurring(task) * 0.20
  );
}

export function getReason(task: Task, logs: CompletionLogEntry[]): string {
  const parts: string[] = [];
  const u = scoreUrgency(task.priority);
  const c = scoreConsistency(task.id, logs);
  const r = scoreRecurring(task);

  if (u >= 1) parts.push('Alta prioridad');
  else if (u >= 0.6) parts.push('Prioridad media');
  else parts.push('Baja prioridad');

  if (c >= 1) parts.push('completada hoy');
  else if (c >= 0.7) parts.push('consistente');
  else parts.push('pendiente');

  if (r > 1) parts.push('recurrente');

  return parts.join(' · ');
}

export function prioritizeTasks(tasks: Task[], logs: CompletionLogEntry[]): ScoredTask[] {
  return tasks
    .filter(t => !t.completed)
    .map(t => ({
      task: t,
      score: scoreTask(t, logs),
      reason: getReason(t, logs),
    }))
    .sort((a, b) => b.score - a.score);
}
