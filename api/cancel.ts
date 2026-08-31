import { kv } from '@vercel/kv';
import { getQstashClient, rateLimit, type Handler } from './_lib';

export default (async function cancel(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await rateLimit('cancel', 60, 60))) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = req.body as { deviceId?: string; taskId?: string; messageId?: string };
  const deviceId = body?.deviceId;
  const taskId = body?.taskId;

  let messageIds: string[] = [];
  if (body?.messageId) {
    messageIds = [body.messageId];
  } else if (deviceId && taskId) {
    const stored = await kv.get<string[] | string>(`remTask:${deviceId}:${taskId}`);
    messageIds = Array.isArray(stored) ? stored : stored ? [stored] : [];
  }

  if (messageIds.length === 0) {
    res.status(200).json({ ok: true, skipped: 'no message' });
    return;
  }

  const client = getQstashClient();
  if (client) {
    for (const id of messageIds) {
      try {
        await client.messages.delete(id);
      } catch (err) {
        console.warn('[cancel] QStash delete failed (may be already delivered):', err);
      }
    }
  }

  for (const id of messageIds) {
    await kv.del(`reminders:${id}`);
  }
  if (deviceId && taskId) {
    await kv.del(`remTask:${deviceId}:${taskId}`);
  }

  res.status(200).json({ ok: true, cancelled: messageIds.length });
}) as Handler;
