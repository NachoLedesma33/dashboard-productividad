import type { Task, Habit, NotificationSettings } from '@/types';

const STORAGE_KEY = 'notification-settings';
const SCHEDULED_KEY = 'scheduled-notifications';
const DAILY_REMINDER_KEY = 'daily-habit-reminder-id';

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let dailyTimer: ReturnType<typeof setTimeout> | null = null;

export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return {
    enabled: false,
    taskReminders: true,
    dailyHabitReminder: false,
    dailyHabitTime: '09:00',
    advanceMinutes: 15,
    sound: true,
  };
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    requireInteraction?: boolean;
  }
): void {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body: options?.body,
      icon: options?.icon ?? '/icon-192x192.png',
      tag: options?.tag,
      requireInteraction: options?.requireInteraction ?? false,
    });
  } catch {
    // SW fallback for mobile PWA
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: options?.body,
          icon: options?.icon ?? '/icon-192x192.png',
          tag: options?.tag,
          requireInteraction: options?.requireInteraction ?? false,
        });
      });
    }
  }
}

export function scheduleTaskReminder(task: Task, settings: NotificationSettings): void {
  cancelTaskReminder(task.id);

  if (!settings.enabled || !settings.taskReminders || !task.reminderAt || task.completed) return;

  const reminderTime = new Date(task.reminderAt).getTime() - settings.advanceMinutes * 60_000;
  const now = Date.now();
  const delay = reminderTime - now;

  if (delay <= 0) return;

  const timer = setTimeout(() => {
    showNotification('Recordatorio', {
      body: task.reminderMessage || `Recordatorio: ${task.title}`,
      tag: `task-${task.id}`,
      requireInteraction: true,
    });
    timers.delete(task.id);
  }, delay);

  timers.set(task.id, timer);
  persistScheduledTimers();
}

export function cancelTaskReminder(taskId: string): void {
  const timer = timers.get(taskId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(taskId);
    persistScheduledTimers();
  }
}

export function scheduleAllTaskReminders(tasks: Task[], settings: NotificationSettings): void {
  clearAllTimers();
  if (!settings.enabled || !settings.taskReminders) return;

  for (const task of tasks) {
    scheduleTaskReminder(task, settings);
  }
}

export function scheduleDailyHabitReminder(habits: Habit[], settings: NotificationSettings): void {
  cancelDailyHabitReminder();

  if (!settings.enabled || !settings.dailyHabitReminder || habits.length === 0) return;

  const [hours, minutes] = settings.dailyHabitTime.split(':').map(Number);

  const scheduleNext = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();

    dailyTimer = setTimeout(() => {
      const pendingHabits = habits.filter(
        (h) => !h.completionDates.some((d) => {
          const date = new Date(d);
          date.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date.getTime() === today.getTime();
        })
      );

      if (pendingHabits.length > 0) {
        showNotification('Hábitos pendientes', {
          body: `Tienes ${pendingHabits.length} hábito${pendingHabits.length > 1 ? 's' : ''} por completar hoy`,
          tag: 'daily-habits',
          requireInteraction: true,
        });
      }

      scheduleNext();
    }, delay);

    try {
      localStorage.setItem(DAILY_REMINDER_KEY, 'true');
    } catch { /* ignore */ }
  };

  scheduleNext();
}

export function cancelDailyHabitReminder(): void {
  if (dailyTimer) {
    clearTimeout(dailyTimer);
    dailyTimer = null;
  }
  try {
    localStorage.removeItem(DAILY_REMINDER_KEY);
  } catch { /* ignore */ }
}

export function cancelAllTaskReminders(): void {
  clearAllTimers();
}

function clearAllTimers(): void {
  for (const [, timer] of timers) {
    clearTimeout(timer);
  }
  timers.clear();
}

function persistScheduledTimers(): void {
  try {
    const entries: [string, number][] = [];
    for (const [id, timer] of timers) {
      entries.push([id, timer as unknown as number]);
    }
    // We store only IDs for re-scheduling on reload
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(entries.map(([id]) => id)));
  } catch { /* ignore */ }
}

export function getScheduledTaskIds(): string[] {
  try {
    const stored = localStorage.getItem(SCHEDULED_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

export function hasActiveTimers(): boolean {
  return timers.size > 0 || dailyTimer !== null;
}
