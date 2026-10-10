type Entry = { count: number; resetAt: number };

const globalWithLimiter = globalThis as typeof globalThis & {
  _fbRateLimit?: Map<string, Entry>;
};

const store =
  globalWithLimiter._fbRateLimit || (globalWithLimiter._fbRateLimit = new Map());

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}
