import { getSQL } from './_lib/neon.js'
import { verifyAuth, AuthError } from './_lib/auth.js'

function calcNextSendAt(frequency, dayOfWeek, dayOfMonth) {
  const now = new Date()
  const next = new Date(now)
  if (frequency === 'weekly') {
    const day = dayOfWeek ?? 1 // default Monday
    const diff = (day - now.getDay() + 7) % 7 || 7
    next.setDate(now.getDate() + diff)
    next.setHours(8, 0, 0, 0)
  } else {
    // monthly
    const dom = dayOfMonth ?? 1
    next.setDate(dom)
    if (next <= now) next.setMonth(next.getMonth() + 1)
    next.setHours(8, 0, 0, 0)
  }
  return next.toISOString()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()

  let user
  try {
    user = await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message })
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const sql = getSQL()

  // ── GET: list schedules ───────────────────────────────────────────
  if (req.method === 'GET') {
    const { dashboard_id } = req.query || {}
    let rows
    if (dashboard_id) {
      rows = await sql`
        SELECT * FROM scheduled_reports 
        WHERE user_id = ${user.id} AND dashboard_id = ${dashboard_id}::uuid
        ORDER BY created_at DESC
      `
    } else {
      rows = await sql`
        SELECT * FROM scheduled_reports 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `
    }
    return res.status(200).json({ schedules: rows })
  }

  // ── POST: create a new schedule ───────────────────────────────────
  if (req.method === 'POST') {
    const { dashboard_id, recipient_email, frequency, day_of_week, day_of_month } = req.body || {}
    if (!dashboard_id || !recipient_email || !frequency) {
      return res.status(400).json({ error: 'dashboard_id, recipient_email, and frequency are required' })
    }
    if (!['weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ error: 'frequency must be weekly or monthly' })
    }
    const next_send_at = calcNextSendAt(frequency, day_of_week, day_of_month)
    const dow = frequency === 'weekly' ? (day_of_week ?? 1) : null
    const dom = frequency === 'monthly' ? (day_of_month ?? 1) : null

    const rows = await sql`
      INSERT INTO scheduled_reports (user_id, dashboard_id, recipient_email, frequency, day_of_week, day_of_month, next_send_at, is_active)
      VALUES (${user.id}, ${dashboard_id}::uuid, ${recipient_email}, ${frequency}, ${dow}, ${dom}, ${next_send_at}, true)
      RETURNING *
    `
    return res.status(201).json({ schedule: rows[0] })
  }

  // ── DELETE: remove a schedule ─────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })
    await sql`DELETE FROM scheduled_reports WHERE id = ${id}::uuid AND user_id = ${user.id}`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
