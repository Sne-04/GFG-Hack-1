/**
 * /api/profiles — CRUD for user profiles (Neon PostgreSQL)
 */
import { getSQL } from './_lib/neon.js'
import { verifyAuth, AuthError } from './_lib/auth.js'

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
    console.error('[profiles] Auth error:', err.message)
  }

  const sql = getSQL()

  // ── GET: fetch profile ─────────────────────────────────────────
  if (req.method === 'GET') {
    const userId = req.query?.userId || user?.id
    if (!userId) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`
    return res.status(200).json({ profile: rows[0] || null })
  }

  // ── POST: upsert profile ──────────────────────────────────────
  if (req.method === 'POST') {
    const { userId, name, company, role, avatar_url, plan, billing_period, 
            razorpay_payment_id, razorpay_order_id, plan_expires_at, phone, email } = req.body || {}
    
    const uid = userId || user?.id
    if (!uid) return res.status(400).json({ error: 'userId required' })

    const rows = await sql`
      INSERT INTO profiles (user_id, email, name, company, role, avatar_url, plan, 
                            billing_period, razorpay_payment_id, razorpay_order_id, 
                            plan_expires_at, phone, updated_at)
      VALUES (${uid}, ${email || null}, ${name || null}, ${company || null}, ${role || null}, 
              ${avatar_url || null}, ${plan || 'free'}, ${billing_period || null},
              ${razorpay_payment_id || null}, ${razorpay_order_id || null},
              ${plan_expires_at || null}, ${phone || null}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        name = COALESCE(EXCLUDED.name, profiles.name),
        company = COALESCE(EXCLUDED.company, profiles.company),
        role = COALESCE(EXCLUDED.role, profiles.role),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        plan = COALESCE(EXCLUDED.plan, profiles.plan),
        billing_period = COALESCE(EXCLUDED.billing_period, profiles.billing_period),
        razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, profiles.razorpay_payment_id),
        razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, profiles.razorpay_order_id),
        plan_expires_at = COALESCE(EXCLUDED.plan_expires_at, profiles.plan_expires_at),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW()
      RETURNING *
    `
    return res.status(200).json({ profile: rows[0] || null })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
