/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Resets on server restart — suitable for edge-case abuse prevention.
 * For production, replace with Redis-backed solution.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  /** Max requests per window */
  limit: number
  /** Window duration in seconds */
  windowSec: number
}

export function rateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowSec * 1000
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: opts.limit - 1, resetAt }
  }

  if (entry.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt }
}

/** Extract client IP from Next.js request headers */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}
