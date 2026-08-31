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

export default (async function schedule(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await rateLimit('schedule', 60, 60))) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = req.body as {
    deviceId?: string;
    taskId?: string;
    remindAt?: number;
    title?: string;
    message?: string;
  };

  const deviceId = body?.deviceId;
  const taskId = body?.taskId;
  const remindAt = body?.remindAt;
  const message = body?.message || 'Tienes un recordatorio pendiente';
  const title = body?.title || 'En Ritmo';

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

  const messageId = makeId();
  const notBefore = Math.floor(remindAt / 1000);
  const url = `${getAppUrl()}/api/notify`;

  try {
    await client.publishJSON({
      url,
      notBefore,
      body: { messageId, taskId },
    });

    await kv.set(`reminders:${messageId}`, { deviceId, taskId, title, message });
    await kv.set(`remTask:${deviceId}:${taskId}`, messageId);

    res.status(200).json({ ok: true, messageId });
  } catch (err) {
    console.error('[schedule] error:', err);
    res.status(500).json({ error: 'Publish failed' });
  }
}) as Handler;
