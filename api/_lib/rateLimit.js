/**
 * In-memory IP-based rate limiter for Vercel serverless functions.
 * Note: Each serverless instance has its own memory — this limits bursts
 * within a single instance. For stricter limits use Upstash Redis.
 */

const store = new Map() // ip → { count, resetAt }

/**
 * @param {string} ip
 * @param {object} opts
 * @param {number} opts.limit   — max requests per window
 * @param {number} opts.window  — window in ms (default 60_000)
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(ip, { limit = 10, window = 60_000 } = {}) {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + window })
    return { allowed: true, remaining: limit - 1, resetIn: window }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now }
}

// Prune old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(ip)
  }
}, 5 * 60_000)
