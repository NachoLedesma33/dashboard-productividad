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

  let messageId = body?.messageId;
  if (!messageId && deviceId && taskId) {
    messageId = (await kv.get<string>(`remTask:${deviceId}:${taskId}`)) || undefined;
  }

  if (!messageId) {
    res.status(200).json({ ok: true, skipped: 'no message' });
    return;
  }

  const client = getQstashClient();
  if (client) {
    try {
      await client.messages.delete(messageId);
    } catch (err) {
      console.warn('[cancel] QStash delete failed (may be already delivered):', err);
    }
  }

  await kv.del(`reminders:${messageId}`);
  if (deviceId && taskId) {
    await kv.del(`remTask:${deviceId}:${taskId}`);
  }

  res.status(200).json({ ok: true });
}) as Handler;
