/**
 * /api/data/queries — CRUD for saved queries (Neon PostgreSQL)
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

  // ── GET: fetch queries ─────────────────────────────────────────
  if (req.method === 'GET') {
    const { userId, id, limit = '20' } = req.query || {}

    if (id) {
      const rows = await sql`SELECT * FROM queries WHERE id = ${id}::uuid`
      return res.status(200).json({ query: rows[0] || null })
    }

    const uid = userId || user?.id
    if (!uid) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`
      SELECT id, query_text, csv_name, created_at 
      FROM queries 
      WHERE user_id = ${uid} 
      ORDER BY created_at DESC 
      LIMIT ${parseInt(limit)}
    `
    return res.status(200).json({ queries: rows })
  }

  // ── POST: save a query ────────────────────────────────────────
  if (req.method === 'POST') {
    const { userId, queryText, resultJson, csvName } = req.body || {}
    const uid = userId || user?.id
    if (!uid || !queryText) return res.status(400).json({ error: 'userId and queryText required' })

    const rows = await sql`
      INSERT INTO queries (user_id, query_text, result_json, csv_name)
      VALUES (${uid}, ${queryText}, ${JSON.stringify(resultJson || null)}::jsonb, ${csvName || null})
      RETURNING *
    `
    return res.status(201).json({ query: rows[0] || null })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
