// In-memory sliding-window rate limiter for the Sales Ops API routes.
// Good enough for the gated beta; swap for Upstash Redis before we open
// `/sales-ops` to the public internet.

type Bucket = { timestamps: number[] };
const buckets = new Map<string, Bucket>();
const SWEEP_EVERY = 1000; // ms
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Record a hit for `key` and return whether it's within the limit of
 * `max` hits per `windowMs` ms. Returns remaining count and a
 * retry-after suggestion when blocked.
 */
export function hit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key) ?? { timestamps: [] };
  const cutoff = now - windowMs;
  bucket.timestamps = bucket.timestamps.filter(t => t > cutoff);
  if (bucket.timestamps.length >= max) {
    const retryAfterMs = Math.max(0, bucket.timestamps[0] + windowMs - now);
    buckets.set(key, bucket);
    return { ok: false, remaining: 0, retryAfterMs };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: max - bucket.timestamps.length, retryAfterMs: 0 };
}

/**
 * Pull a stable client identifier out of request headers. Vercel forwards
 * the real client IP in `x-forwarded-for`; falls back to a header we trust.
 */
export function clientKey(req: Request): string {
  const h = (name: string) => req.headers.get(name) ?? '';
  const fwd = h('x-forwarded-for').split(',')[0]?.trim();
  const real = h('x-real-ip');
  const cf = h('cf-connecting-ip');
  return fwd || real || cf || 'unknown';
}

export function clientKeyFromCookie(req: Request): string | null {
  const cookie = req.headers.get('cookie') || '';
  // Any stable cookie we set; sales_ops_auth is just the on/off flag so
  // treat it as a visitor cookie for scoping. Combined with IP in the key.
  if (cookie.includes('sales_ops_auth=1')) return 'authed';
  return null;
}
