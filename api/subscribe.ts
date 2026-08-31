import { rateLimit, saveSubscription, type Handler, type PushSubscriptionLike } from './_lib';

export default (async function subscribe(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await rateLimit('subscribe', 30, 60))) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const body = req.body as { deviceId?: string; subscription?: PushSubscriptionLike };
  const deviceId = body?.deviceId;
  const subscription = body?.subscription;

  if (!deviceId || !subscription?.endpoint) {
    res.status(400).json({ error: 'Missing deviceId or subscription' });
    return;
  }

  // re-subscribe idempotent: existing subscription replaced
  await saveSubscription(deviceId, subscription);
  res.status(200).json({ ok: true });
}) as Handler;
