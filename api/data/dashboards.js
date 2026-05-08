/**
 * /api/data/dashboards — CRUD for dashboards (Neon PostgreSQL)
 */
import { getSQL } from '../_lib/neon.js'
import { verifyAuth, AuthError } from '../_lib/auth.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()

  let user
  try {
    user = await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message })
  }

  const sql = getSQL()

  // ── GET ────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { userId, id, shareToken, count, limit = '20' } = req.query || {}

    // Fetch by share token (public — no auth needed)
    if (shareToken) {
      const rows = await sql`SELECT * FROM dashboards WHERE share_token = ${shareToken}`
      return res.status(200).json({ dashboard: rows[0] || null })
    }

    // Fetch single by ID
    if (id) {
      const rows = await sql`SELECT * FROM dashboards WHERE id = ${id}::uuid`
      return res.status(200).json({ dashboard: rows[0] || null })
    }

    const uid = userId || user?.id
    if (!uid) return res.status(400).json({ error: 'userId required' })

    // Count only
    if (count === 'true') {
      const rows = await sql`SELECT COUNT(*)::int as count FROM dashboards WHERE user_id = ${uid}`
      return res.status(200).json({ count: rows[0]?.count || 0 })
    }

    // List dashboards
    const rows = await sql`
      SELECT id, title, csv_name, query_text, created_at, is_favorite 
      FROM dashboards 
      WHERE user_id = ${uid} 
      ORDER BY created_at DESC 
      LIMIT ${parseInt(limit)}
    `
    return res.status(200).json({ dashboards: rows })
  }

  // ── POST: create dashboard ────────────────────────────────────
  if (req.method === 'POST') {
    const { userId, csvName, schema, resultJson, queryText } = req.body || {}
    const uid = userId || user?.id
    if (!uid) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`
      INSERT INTO dashboards (user_id, csv_name, schema_json, result_json, query_text)
      VALUES (${uid}, ${csvName || null}, ${JSON.stringify(schema || null)}::jsonb, 
              ${JSON.stringify(resultJson || null)}::jsonb, ${queryText || null})
      RETURNING *
    `
    return res.status(201).json({ dashboard: rows[0] || null })
  }

  // ── PATCH: update dashboard ───────────────────────────────────
  if (req.method === 'PATCH') {
    const { id, title, is_favorite, generateShareToken } = req.body || {}
    if (!id) return res.status(400).json({ error: 'id required' })

    if (generateShareToken) {
      const token = crypto.randomUUID ? crypto.randomUUID() : 
        Math.random().toString(36).slice(2) + Date.now().toString(36)
      const rows = await sql`
        UPDATE dashboards SET share_token = ${token} WHERE id = ${id}::uuid RETURNING *
      `
      return res.status(200).json({ dashboard: rows[0] || null })
    }

    if (title !== undefined) {
      const rows = await sql`
        UPDATE dashboards SET title = ${title} WHERE id = ${id}::uuid RETURNING *
      `
      return res.status(200).json({ dashboard: rows[0] || null })
    }

    if (is_favorite !== undefined) {
      const rows = await sql`
        UPDATE dashboards SET is_favorite = ${is_favorite} WHERE id = ${id}::uuid RETURNING *
      `
      return res.status(200).json({ dashboard: rows[0] || null })
    }

    return res.status(400).json({ error: 'Nothing to update' })
  }

  // ── DELETE ────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query || {}
    if (!id) return res.status(400).json({ error: 'id required' })

    await sql`DELETE FROM dashboards WHERE id = ${id}::uuid`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
