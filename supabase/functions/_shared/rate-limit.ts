/* global Request */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function clientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? "unknown";
}

function prune(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  req: Request,
  namespace: string,
  options: { limit: number; windowMs: number; keyParts?: string[] },
) {
  const now = Date.now();
  prune(now);

  const key = [namespace, clientIp(req), ...(options.keyParts ?? [])].filter(Boolean).join(":");
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
    return { ok: true, remaining: options.limit - 1, resetAt: bucket.resetAt, headers: rateLimitHeaders(options.limit, options.limit - 1, bucket.resetAt) };
  }

  current.count += 1;
  const remaining = Math.max(0, options.limit - current.count);
  const headers = rateLimitHeaders(options.limit, remaining, current.resetAt);
  if (current.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return { ok: false, retryAfter, resetAt: current.resetAt, headers: { ...headers, "Retry-After": String(retryAfter) } };
  }

  return { ok: true, remaining, resetAt: current.resetAt, headers };
}

function rateLimitHeaders(limit: number, remaining: number, resetAt: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}
