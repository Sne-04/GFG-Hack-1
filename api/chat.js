import { checkRateLimit } from './_lib/rateLimit.js'
import { verifyAuth, AuthError } from './_lib/auth.js'
import { callLLM, getAvailableProviders } from './_lib/llm.js'

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

  // ── Auth verification (Clerk — optional, skipped if not configured) ──
  try {
    await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.status).json({ error: { message: err.message } })
    }
    // Unexpected auth error — log and continue (don't block the request)
    console.error('[chat] Auth check failed unexpectedly:', err.message)
  }

  // ── Request validation ─────────────────────────────────────────
  const { model, max_tokens, messages, response_format } = req.body || {}
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'Invalid request: messages array required' } })
  }

  // ── Multi-LLM call with automatic fallback ─────────────────────
  try {
    const data = await callLLM({
      messages,
      maxTokens: Math.min(max_tokens || 4096, 4096),
      responseFormat: response_format || null,
    })

    // Log token usage and provider for monitoring
    const provider = data._provider || 'unknown'
    const usedModel = data._model || 'unknown'
    if (data.usage) {
      console.log(`[chat] ✅ ${provider}/${usedModel} — prompt:${data.usage.prompt_tokens} completion:${data.usage.completion_tokens} total:${data.usage.total_tokens} ip:${ip}`)
    }

    return res.status(200).json(data)

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[chat] Request timeout, ip:', ip)
      return res.status(504).json({ error: { message: 'Request timed out. Please try again.' } })
    }

    console.error('[chat] All providers failed:', error.message)
    return res.status(500).json({
      error: {
        message: 'AI service temporarily unavailable. Please try again in a moment.',
        providers: getAvailableProviders(),
      }
    })
  }
}
