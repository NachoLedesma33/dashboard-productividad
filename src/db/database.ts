import Dexie, { type EntityTable } from 'dexie';
import type { Task, Habit } from '@/types';

class ProductivityDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  habits!: EntityTable<Habit, 'id'>;

  constructor() {
    super('productivity-db');
    this.version(1).stores({
      tasks: 'id, priority, completedAt',
      habits: 'id',
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

export async function getAllHabits(): Promise<Habit[]> {
  return db.habits.toArray();
}