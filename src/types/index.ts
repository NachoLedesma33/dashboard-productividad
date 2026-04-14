export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  completionDates: Date[];
}