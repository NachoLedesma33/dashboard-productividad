import { kv } from '@vercel/kv';
import {
  getQstashClient,
  getAppUrl,
  rateLimit,
  getSubscription,
  type Handler,
} from './_lib';

function makeId(): string {
  try {
    return globalThis.crypto?.randomUUID?.() || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  } catch {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

interface ScheduleEvent {
  messageId: string;
  notBefore: number;
  title: string;
  body: string;
}

function buildCountdownEvents(args: {
  remindAt: number;
  title: string;
  message: string;
  advanceMinutes: number;
  countdownDays: number;
}): ScheduleEvent[] {
  const events: ScheduleEvent[] = [];
  const remindMs = args.remindAt;
  const dayMs = 24 * 60 * 60 * 1000;

  // Countdown ahead-of-time: "En N día(s): ..." for N = countdownDays..1
  for (let d = args.countdownDays; d >= 1; d--) {
    const when = remindMs - d * dayMs;
    if (when <= Date.now()) break;
    const label = d === 1 ? 'En 1 día' : `En ${d} días`;
    events.push({
      messageId: makeId(),
      notBefore: Math.floor(when / 1000),
      title: 'Recordatorio',
      body: `${label}: ${args.title}`,
    });
  }

  // Final reminder at the chosen advance time
  const finalWhen = remindMs - args.advanceMinutes * 60_000;
  if (finalWhen > Date.now()) {
    events.push({
      messageId: makeId(),
      notBefore: Math.floor(finalWhen / 1000),
      title: args.title || 'Recordatorio',
      body: args.message,
    });
  }

  return events;
}

export default (async function schedule(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await rateLimit('schedule', 30, 60))) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = req.body as {
    deviceId?: string;
    taskId?: string;
    remindAt?: number;
    title?: string;
    message?: string;
    advanceMinutes?: number;
    countdownDays?: number;
  };

  const deviceId = body?.deviceId;
  const taskId = body?.taskId;
  const remindAt = body?.remindAt;
  const title = body?.title || 'Recordatorio';
  const message = body?.message || 'Tienes un recordatorio pendiente';
  const advanceMinutes = Math.max(0, body?.advanceMinutes ?? 0);
  const countdownDays = Math.min(14, Math.max(0, body?.countdownDays ?? 7));

  if (!deviceId || !taskId || typeof remindAt !== 'number' || Number.isNaN(remindAt)) {
    res.status(400).json({ error: 'Missing deviceId, taskId or remindAt' });
    return;
  }

  const subscription = await getSubscription(deviceId);
  if (!subscription?.endpoint) {
    res.status(200).json({ error: 'no_active_subscription' });
    return;
  }

  const client = getQstashClient();
  if (!client) {
    res.status(500).json({ error: 'QStash not configured' });
    return;
  }

  const events = buildCountdownEvents({ remindAt, title, message, advanceMinutes, countdownDays });
  if (events.length === 0) {
    res.status(200).json({ ok: true, scheduled: 0, messageIds: [] });
    return;
  }

  const url = `${getAppUrl()}/api/notify`;
  const messageIds: string[] = [];

  try {
    for (const ev of events) {
      await client.publishJSON({
        url,
        notBefore: ev.notBefore,
        body: { messageId: ev.messageId, taskId, title: ev.title, body: ev.body },
      });
      await kv.set(`reminders:${ev.messageId}`, {
        deviceId,
        taskId,
        title: ev.title,
        message: ev.body,
      });
      messageIds.push(ev.messageId);
    }

    await kv.set(`remTask:${deviceId}:${taskId}`, messageIds);

    res.status(200).json({ ok: true, scheduled: messageIds.length, messageIds });
  } catch (err) {
    console.error('[schedule] error:', err);
    res.status(500).json({ error: 'Publish failed' });
  }
}) as Handler;
