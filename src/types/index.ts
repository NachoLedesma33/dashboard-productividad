export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  completionDates: Date[];
}