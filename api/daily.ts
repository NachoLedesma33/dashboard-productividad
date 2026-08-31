import { getReceiver, readRawBody, getSubscription, sendPush, type Handler } from './_lib';
import { kv } from '@vercel/kv';

export default (async function daily(req, res) {
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

  // Broadcast a gentle nudge to every subscribed device.
  let sent = 0;
  try {
    for await (const key of kv.scanIterator({ match: 'subs:*', count: 100 })) {
      const deviceId = key.slice('subs:'.length);
      const subscription = await getSubscription(deviceId);
      if (subscription?.endpoint) {
        const ok = await sendPush(subscription, {
          title: 'En Ritmo',
          message: 'Hoy también cuenta. Revisa tus hábitos ✦',
        });
        if (ok) sent++;
      }
    }
    res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error('[daily] error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}) as Handler;
