import type { Task } from '@/types';

const DEVICE_KEY = 'push-device-id';
const REMINDER_MSG_KEY = 'push-reminder-messageIds';

const FALLBACK_VAPID_PUBLIC_KEY =
  'BGcgiIRlPe892E1bRXwNmyNmGOeMbMrZZl1F6RcWcuqyqPLZ8LwxQWraCej7ZFfCcYKaZi2UC345rCyn8_KjI3U';

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'device-fallback';
  }
}

function getVapidPublicKey(): string | null {
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || FALLBACK_VAPID_PUBLIC_KEY || null;
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE || '';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function post(path: string, body: unknown): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function isPushSupported(): Promise<boolean> {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!getVapidPublicKey()
  );
}

export async function subscribeToPush(): Promise<boolean> {
  if (!(await isPushSupported())) return false;

  const reg = await navigator.serviceWorker.ready;
  const vapidKey = getVapidPublicKey()!;

  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (err) {
      console.warn('[Push] subscribe failed:', err);
      return false;
    }
  }

  try {
    await post('/api/subscribe', {
      deviceId: getDeviceId(),
      subscription: subscription.toJSON(),
    });
    return true;
  } catch (err) {
    console.warn('[Push] register failed:', err);
    return false;
  }
}

export async function scheduleReminder(task: Task, advanceMinutes: number): Promise<string | null> {
  if (!task.reminderAt || task.completed) return null;
  if (!(await isPushSupported())) return null;

  const remindAt = new Date(task.reminderAt).getTime() - advanceMinutes * 60_000;
  const now = Date.now();
  if (remindAt <= now) return null;

  try {
    const res = await post('/api/schedule', {
      deviceId: getDeviceId(),
      taskId: task.id,
      remindAt,
      title: 'Recordatorio',
      message: task.reminderMessage || `Recordatorio: ${task.title}`,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { messageId?: string };
    if (data.messageId) {
      saveReminderMessageId(task.id, data.messageId);
    }
    return data.messageId ?? null;
  } catch (err) {
    console.warn('[Push] schedule failed:', err);
    return null;
  }
}

export async function cancelReminder(taskId: string): Promise<void> {
  const messageId = getReminderMessageId(taskId);
  if (!messageId) return;
  try {
    await post('/api/cancel', { deviceId: getDeviceId(), taskId, messageId });
  } catch (err) {
    console.warn('[Push] cancel failed:', err);
  } finally {
    clearReminderMessageId(taskId);
  }
}

export function getReminderMessageId(taskId: string): string | null {
  try {
    const map = JSON.parse(localStorage.getItem(REMINDER_MSG_KEY) || '{}');
    return map[taskId] || null;
  } catch {
    return null;
  }
}

function saveReminderMessageId(taskId: string, messageId: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(REMINDER_MSG_KEY) || '{}');
    map[taskId] = messageId;
    localStorage.setItem(REMINDER_MSG_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

export function clearReminderMessageId(taskId: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(REMINDER_MSG_KEY) || '{}');
    delete map[taskId];
    localStorage.setItem(REMINDER_MSG_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

export function registerPushStateListener(onChange: (enabled: boolean) => void): () => void {
  if (!navigator.serviceWorker) return () => {};
  return navigator.serviceWorker.addEventListener?.('message', (event: MessageEvent) => {
    if (event.data?.type === 'push-state') {
      onChange(event.data.enabled);
    }
  }) as unknown as () => void;
}
