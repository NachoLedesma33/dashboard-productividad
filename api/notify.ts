import { getReceiver, readRawBody, getSubscription, getAppUrl, sendPush, type Handler } from './_lib';
import { kv } from '@vercel/kv';

export default (async function notify(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const receiver = getReceiver();
  if (!receiver) {
    res.status(500).json({ error: 'QStash not configured' });
    return;
  }

  const signature = String(req.headers['upstash-signature'] || '');
  const raw = readRawBody(req);
  if (!signature || raw.length === 0) {
    res.status(400).json({ error: 'Missing signature' });
    return;
  }

  const valid = await receiver.verify({ signature, body: raw.toString() });
  if (!valid) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const body = req.body as { messageId?: string; taskId?: string } | undefined;
  const messageId = body?.messageId;
  if (!messageId) {
    res.status(400).json({ error: 'Missing messageId' });
    return;
  }

  try {
    const reminder = await kv.get<{ deviceId: string; taskId: string; title: string; message: string }>(
      `reminders:${messageId}`,
    );
    if (!reminder) {
      res.status(200).json({ ok: true, skipped: 'no reminder' });
      return;
    }

    const subscription = await getSubscription(reminder.deviceId);
    if (!subscription) {
      res.status(200).json({ ok: true, skipped: 'no subscription' });
      return;
    }

    const payload = { title: reminder.title, message: reminder.message };
    const sent = await sendPush(subscription, payload);

    await kv.del(`reminders:${messageId}`);
    await kv.del(`remTask:${reminder.deviceId}:${reminder.taskId}`);

    const appUrl = getAppUrl();
    res.status(200).json({ ok: true, sent, url: appUrl });
  } catch (err) {
    console.error('[notify] error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}) as Handler;
