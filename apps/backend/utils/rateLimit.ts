// Small in-memory, per-visitor limiter for expensive work (a fresh analysis costs
// a headless browser plus dozens of Gemini calls). One process, so a Map is
// enough; it resets on restart, which is fine for abuse protection.
// Callers pass req.ip: nginx sets X-Forwarded-For from Cloudflare's
// CF-Connecting-IP and Express trusts it from loopback only.
export function createLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  // forget idle visitors so the map can't grow without bound
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const recent = times.filter((t) => t > cutoff);
      if (recent.length === 0) hits.delete(key);
      else hits.set(key, recent);
    }
  }, windowMs).unref();

  return {
    // records one use; returns how long to wait when the visitor is over the limit
    take(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (recent.length >= max) {
        return { ok: false, retryAfterSec: Math.ceil(((recent[0] ?? now) + windowMs - now) / 1000) };
      }
      recent.push(now);
      hits.set(key, recent);
      return { ok: true };
    },
  };
}
