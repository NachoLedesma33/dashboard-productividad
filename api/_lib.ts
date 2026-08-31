import { kv } from '@vercel/kv';
import webpush from 'web-push';
import { Client, Receiver } from '@upstash/qstash';

interface PushSubscriptionLike {
  endpoint: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

interface VercelReq {
  method?: string;
  headers: Record<string, string | string[] | undefined> & { get?: (k: string) => string | null };
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (body: unknown) => void;
  send: (body?: unknown) => void;
  setHeader?: (k: string, v: string) => void;
}

export type Handler = (req: VercelReq, res: VercelRes) => Promise<void> | void;

export type { VercelReq, VercelRes, PushSubscriptionLike, Handler };

function readRawBody(req: VercelReq): Buffer {
  // Vercel Functions expose the parsed body; for signature verification we
  // need the raw string. We re-serialize the parsed JSON to reconstruct it.
  const body = req.body;
  if (body === undefined) return Buffer.from('');
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  return Buffer.from(JSON.stringify(body));
}

function getQstashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  const baseUrl = process.env.QSTASH_URL || 'https://qstash.upstash.io';
  return new Client({ token, baseUrl });
}

function getReceiver(): Receiver | null {
  const current = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!current || !next) return null;
  return new Receiver({
    currentSigningKey: current,
    nextSigningKey: next,
  });
}

function setupWebPush(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@enritmo.app';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

function getAppUrl(): string {
  return process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:4173';
}

async function getSubscription(deviceId: string): Promise<PushSubscriptionLike | null> {
  return kv.get<PushSubscriptionLike>(`subs:${deviceId}`);
}

async function saveSubscription(deviceId: string, subscription: PushSubscriptionLike): Promise<void> {
  await kv.set(`subs:${deviceId}`, subscription);
}

async function sendPush(subscription: PushSubscriptionLike, payload: Record<string, unknown>): Promise<boolean> {
  if (!setupWebPush()) return false;
  const text = JSON.stringify(payload);
  try {
    await webpush.sendNotification(subscription as never, text);
    return true;
  } catch (err) {
    const code = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { status?: number })?.status;
    // 404/410 = subscription expired/removed
    if (code === 404 || code === 410) {
      // Ignore; caller may clean up
    }
    console.warn('[Push] send failed:', err);
    return false;
  }
}

async function rateLimit(scope: string, limit = 30, windowSec = 60): Promise<boolean> {
  const key = `rl:${scope}`;
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, windowSec);
  }
  return count <= limit;
}

export {
  readRawBody,
  getQstashClient,
  getReceiver,
  setupWebPush,
  getAppUrl,
  getSubscription,
  saveSubscription,
  sendPush,
  rateLimit,
};
