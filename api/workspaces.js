import { createClient } from '@supabase/supabase-js'
import { verifyAuth, AuthError } from './_lib/auth.js'

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
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

  // ── GET: list workspaces the user belongs to ──────────────────────
  if (req.method === 'GET') {
    // Workspaces owned by user OR where user is a member
    const { data: owned } = await supabase
      .from('workspaces')
      .select('*, workspace_members(id, user_id, role, invited_email, joined_at)')
      .eq('owner_id', user.id)

    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces(id, name, owner_id, created_at, workspace_members(id, user_id, role, invited_email, joined_at))')
      .eq('user_id', user.id)
      .not('joined_at', 'is', null)

    const ownedWorkspaces = owned || []
    const memberWorkspaces = (memberships || [])
      .map(m => ({ ...m.workspaces, _role: m.role }))
      .filter(w => w && !ownedWorkspaces.find(o => o.id === w.id))

    return res.status(200).json({
      workspaces: [
        ...ownedWorkspaces.map(w => ({ ...w, _role: 'admin' })),
        ...memberWorkspaces,
      ]
    })
  }

  // ── POST: create a workspace ──────────────────────────────────────
  if (req.method === 'POST') {
    const { name } = req.body || {}
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })

    // Add the creator as admin member
    await supabase.from('workspace_members').insert({
      workspace_id: data.id,
      user_id: user.id,
      role: 'admin',
      joined_at: new Date().toISOString(),
    })

    return res.status(201).json({ workspace: data })
  }

  // ── DELETE: remove a workspace (owner only) ───────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id is required' })

    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
