const buckets = new Map();

function clientIp(request) {
  const forwardedFor = request.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  return request.socket?.remoteAddress || "unknown";
}

function prune(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(request, response, options) {
  const now = Date.now();
  prune(now);

  const windowMs = options.windowMs;
  const limit = options.limit;
  const keyParts = [options.namespace, clientIp(request), ...(options.keyParts || [])].filter(Boolean);
  const key = keyParts.join(":");
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    response.setHeader("x-ratelimit-limit", String(limit));
    response.setHeader("x-ratelimit-remaining", String(Math.max(0, limit - 1)));
    response.setHeader("x-ratelimit-reset", String(Math.ceil(resetAt / 1000)));
    return { ok: true, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  response.setHeader("x-ratelimit-limit", String(limit));
  response.setHeader("x-ratelimit-remaining", String(remaining));
  response.setHeader("x-ratelimit-reset", String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    response.setHeader("retry-after", String(retryAfter));
    return { ok: false, retryAfter, resetAt: bucket.resetAt };
  }

  return { ok: true, remaining, resetAt: bucket.resetAt };
}
