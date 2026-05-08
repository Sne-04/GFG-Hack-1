import { getSQL } from './_lib/neon.js'
import { verifyAuth, AuthError } from './_lib/auth.js'

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

  // ── GET: list workspaces the user belongs to ──────────────────────
  if (req.method === 'GET') {
    const owned = await sql`
      SELECT w.*, json_agg(json_build_object(
        'id', wm.id, 'user_id', wm.user_id, 'role', wm.role, 
        'invited_email', wm.invited_email, 'joined_at', wm.joined_at
      )) FILTER (WHERE wm.id IS NOT NULL) as workspace_members
      FROM workspaces w
      LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE w.owner_id = ${user.id}
      GROUP BY w.id
    `

    const memberships = await sql`
      SELECT wm.role, w.*,
        json_agg(json_build_object(
          'id', wm2.id, 'user_id', wm2.user_id, 'role', wm2.role,
          'invited_email', wm2.invited_email, 'joined_at', wm2.joined_at
        )) FILTER (WHERE wm2.id IS NOT NULL) as workspace_members
      FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      LEFT JOIN workspace_members wm2 ON wm2.workspace_id = w.id
      WHERE wm.user_id = ${user.id} AND wm.joined_at IS NOT NULL
      GROUP BY w.id, wm.role
    `

    const ownedIds = new Set(owned.map(w => w.id))
    const memberWorkspaces = memberships
      .filter(m => !ownedIds.has(m.id))
      .map(m => ({ ...m, _role: m.role }))

    return res.status(200).json({
      workspaces: [
        ...owned.map(w => ({ ...w, _role: 'admin' })),
        ...memberWorkspaces,
      ]
    })
  }

  // ── POST: create a workspace ──────────────────────────────────────
  if (req.method === 'POST') {
    const { name } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

    const rows = await sql`
      INSERT INTO workspaces (name, owner_id) VALUES (${name.trim()}, ${user.id}) RETURNING *
    `
    const workspace = rows[0]

    // Add the creator as admin member
    await sql`
      INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
      VALUES (${workspace.id}, ${user.id}, 'admin', NOW())
    `

    return res.status(201).json({ workspace })
  }

  // ── DELETE: remove a workspace (owner only) ───────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })

    await sql`DELETE FROM workspaces WHERE id = ${id}::uuid AND owner_id = ${user.id}`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
