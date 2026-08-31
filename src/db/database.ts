import Dexie, { type EntityTable } from 'dexie';
import type { Task, Habit, CompletionLogEntry } from '@/types';

class ProductivityDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  completionLog!: EntityTable<CompletionLogEntry, 'id'>;

  constructor() {
    super('productivity-db');
    this.version(3).stores({
      tasks: 'id, priority, completedAt, reminderAt',
      habits: 'id, reminderTime',
      completionLog: '++id, dateKey, taskId',
    });
  }
}

export const db = new ProductivityDatabase();

export async function addTask(task: Task): Promise<string> {
  return db.tasks.add(task) as Promise<string>;
}

export async function updateTask(
  id: string,
  changes: Partial<Omit<Task, 'id'>>
): Promise<number> {
  return db.tasks.update(id, changes);
}

export async function bulkUpdateTasks(tasks: Task[]): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    for (const task of tasks) {
      await db.tasks.put(task);
    }
  });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function addHabit(habit: Habit): Promise<string> {
  return db.habits.add(habit) as Promise<string>;
}

export async function toggleHabitToday(id: string): Promise<void> {
  const habit = await db.habits.get(id);
  if (!habit) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingIndex = habit.completionDates.findIndex((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (existingIndex >= 0) {
    const updatedDates = habit.completionDates.filter((_, i) => i !== existingIndex);
    await db.habits.update(id, { completionDates: updatedDates });
  } else {
    const updatedDates = [...habit.completionDates, new Date()];
    await db.habits.update(id, { completionDates: updatedDates });
  }
}

export async function deleteHabit(id: string): Promise<void> {
  await db.habits.delete(id);
}

export async function updateHabit(id: string, name: string): Promise<number> {
  return db.habits.update(id, { name });
}

export async function getAllHabits(): Promise<Habit[]> {
  return db.habits.toArray();
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function addCompletionLog(taskId: string, date: Date = new Date()): Promise<void> {
  const dateKey = formatDateKey(date);
  const existing = await db.completionLog.where({ taskId, dateKey }).first();
  if (!existing) {
    await db.completionLog.add({ taskId, dateKey, createdAt: new Date() });
  }
}

export async function removeTodayCompletionLog(taskId: string): Promise<void> {
  const dateKey = formatDateKey(new Date());
  const entry = await db.completionLog.where({ taskId, dateKey }).first();
  if (entry?.id) {
    await db.completionLog.delete(entry.id);
  }
}

export async function getCompletionLogs(): Promise<CompletionLogEntry[]> {
  return db.completionLog.toArray();
}

export async function purgeOldCompletionLogs(daysToKeep: number = 7): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffKey = formatDateKey(cutoff);
  await db.completionLog.where('dateKey').below(cutoffKey).delete();
}