export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  recurringDays?: number[];
}

export interface Habit {
  id: string;
  name: string;
  completionDates: Date[];
}

export interface CompletionLogEntry {
  id?: number;
  taskId: string;
  dateKey: string;
  createdAt: Date;
}