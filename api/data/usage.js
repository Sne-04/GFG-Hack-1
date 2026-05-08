/**
 * /api/data/usage — API usage tracking (Neon PostgreSQL)
 */
import { getSQL } from '../_lib/neon.js'
import { verifyAuth, AuthError } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()

  let user
  try {
    user = await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message })
  }

  const sql = getSQL()
  const today = new Date().toISOString().split('T')[0]

  // ── GET: fetch today's usage ──────────────────────────────────
  if (req.method === 'GET') {
    const userId = req.query?.userId || user?.id
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`
      SELECT query_count FROM api_usage WHERE user_id = ${userId} AND month = ${today}
    `
    return res.status(200).json({ queryCount: rows[0]?.query_count || 0 })
  }

  // ── POST: increment daily usage ───────────────────────────────
  if (req.method === 'POST') {
    const userId = req.body?.userId || user?.id
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`
      INSERT INTO api_usage (user_id, month, query_count)
      VALUES (${userId}, ${today}, 1)
      ON CONFLICT (user_id, month) 
      DO UPDATE SET query_count = api_usage.query_count + 1
      RETURNING *
    `
    return res.status(200).json({ usage: rows[0] || null })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
