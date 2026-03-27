import { createClient } from '@supabase/supabase-js'
import { verifyAuth, AuthError } from './_lib/auth.js'

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

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

  const supabase = getServiceClient()

  // ── GET: list schedules for a dashboard ───────────────────────────
  if (req.method === 'GET') {
    const { dashboard_id } = req.query
    const query = supabase
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (dashboard_id) query.eq('dashboard_id', dashboard_id)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ schedules: data || [] })
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
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert({
        user_id: user.id,
        dashboard_id,
        recipient_email,
        frequency,
        day_of_week: frequency === 'weekly' ? (day_of_week ?? 1) : null,
        day_of_month: frequency === 'monthly' ? (day_of_month ?? 1) : null,
        next_send_at,
        is_active: true,
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ schedule: data })
  }

  // ── DELETE: remove a schedule ─────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })
    const { error } = await supabase
      .from('scheduled_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // ensure ownership
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
