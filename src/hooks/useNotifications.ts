import { useState, useCallback } from 'react';
import type { Task, Habit, NotificationSettings } from '@/types';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestPermission,
  scheduleAllTaskReminders,
  scheduleDailyHabitReminder,
  cancelAllTaskReminders,
  cancelDailyHabitReminder,
} from '@/utils/notifications/scheduler';

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) return Notification.permission;
    return 'denied';
  });

  const updateSettings = useCallback((partial: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveNotificationSettings(next);
      return next;
    });
  }, []);

  const enable = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    if (result === 'granted') {
      updateSettings({ enabled: true });
    }
    return result;
  }, [updateSettings]);

  const disable = useCallback(() => {
    updateSettings({ enabled: false });
    cancelAllTaskReminders();
    cancelDailyHabitReminder();
  }, [updateSettings]);

  const syncReminders = useCallback(
    (tasks: Task[], habits: Habit[]) => {
      if (!settings.enabled) return;
      scheduleAllTaskReminders(tasks, settings);
      scheduleDailyHabitReminder(habits, settings);
    },
    [settings]
  );

  return {
    settings,
    permission,
    updateSettings,
    enable,
    disable,
    syncReminders,
    isSupported: 'Notification' in window,
  };
}
