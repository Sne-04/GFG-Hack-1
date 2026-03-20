import { checkRateLimit } from './_lib/rateLimit.js'
import { verifyAuth, AuthError } from './_lib/auth.js'

const TIMEOUT_MS = 30_000 // 30 second hard timeout for OpenAI calls

export default async function handler(req, res) {
  // ── CORS headers ───────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ── Rate limiting (10 req/min per IP) ──────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const rate = checkRateLimit(ip, { limit: 10, window: 60_000 })
  if (!rate.allowed) {
    res.setHeader('Retry-After', Math.ceil(rate.resetIn / 1000))
    return res.status(429).json({
      error: { message: `Rate limit exceeded. Try again in ${Math.ceil(rate.resetIn / 1000)}s.` }
    })
  }

  // ── Auth verification (optional — skipped if Supabase not configured) ──
  try {
    await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: { message: err.message } })
    }
    // Unexpected auth error — log and continue (don't block the request)
    console.error('[chat] Auth check failed unexpectedly:', err.message)
  }

  // ── API key check ──────────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'Server API key not configured' } })
  }

  // ── Request validation ─────────────────────────────────────────
  const { model, max_tokens, messages, response_format } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'Invalid request: messages array required' } })
  }

  // ── OpenAI call with timeout ───────────────────────────────────
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const body = {
      model: model || 'gpt-4o',
      max_tokens: Math.min(max_tokens || 4096, 4096),
      messages,
    }
    if (response_format) body.response_format = response_format

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const data = await response.json()

    if (!response.ok) {
      console.error('[chat] OpenAI error:', response.status, data?.error?.message)
      return res.status(response.status).json(data)
    }

    // Log token usage for monitoring
    if (data.usage) {
      console.log(`[chat] tokens used — prompt:${data.usage.prompt_tokens} completion:${data.usage.completion_tokens} total:${data.usage.total_tokens} ip:${ip}`)
    }

    return res.status(200).json(data)

  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      console.error('[chat] Request timeout after 30s, ip:', ip)
      return res.status(504).json({ error: { message: 'Request timed out. Please try again.' } })
    }

    console.error('[chat] Unexpected error:', error.message)
    return res.status(500).json({ error: { message: 'Internal server error' } })
  }
}
