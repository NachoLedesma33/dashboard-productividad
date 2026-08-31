export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  recurringDays?: number[];
  reminderAt?: Date | null;
  reminderMessage?: string;
}

export interface Habit {
  id: string;
  name: string;
  completionDates: Date[];
  reminderTime?: string | null; // HH:MM format
}

export interface CompletionLogEntry {
  id?: number;
  taskId: string;
  dateKey: string;
  createdAt: Date;
}

export type CalendarEventCategory = 'tarea' | 'examen' | 'medico' | 'reunion' | 'personal' | 'otro';

export interface CalendarEvent {
  id: string;
  title: string;
  dateKey: string; // YYYY-MM-DD
  category: CalendarEventCategory;
  time?: string;   // HH:MM
  reminderAt?: Date | null;
  reminderMessage?: string;
  createdAt: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  taskReminders: boolean;
  dailyHabitReminder: boolean;
  dailyHabitTime: string; // HH:MM
  advanceMinutes: number; // minutes before task reminder
  sound: boolean;
}