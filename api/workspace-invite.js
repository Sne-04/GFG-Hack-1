import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { verifyAuth, AuthError } from './_lib/auth.js'

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role not configured')
  return createClient(url, key)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let user
  try {
    user = await verifyAuth(req)
  } catch (err) {
    if (err instanceof AuthError) return res.status(err.status).json({ error: err.message })
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const supabase = getServiceClient()

  // ── DELETE: remove a member ───────────────────────────────────────
  if (req.method === 'DELETE') {
    const { workspace_id, member_id } = req.query
    // Only workspace owner or the member themselves can remove
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', member_id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  // ── POST: invite a member by email ────────────────────────────────
  const { workspace_id, email, role = 'viewer' } = req.body || {}
  if (!workspace_id || !email) {
    return res.status(400).json({ error: 'workspace_id and email are required' })
  }
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin, editor, or viewer' })
  }

  // Verify requester is owner or admin of the workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace_id)
    .eq('user_id', user.id)
    .single()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, owner_id')
    .eq('id', workspace_id)
    .single()

  const isOwner = workspace?.owner_id === user.id
  const isAdmin = membership?.role === 'admin'
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Only workspace admins can invite members' })
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('invited_email', email)
    .single()

  if (existing) return res.status(409).json({ error: 'User already invited' })

  // Insert pending member record
  const { data: member, error: insertErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id,
      invited_email: email,
      role,
      // user_id left null until they accept
    })
    .select()
    .single()

  if (insertErr) return res.status(500).json({ error: insertErr.message })

  // Send invitation email
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    const base = process.env.VITE_APP_URL || 'https://app.datamind.ai'
    const inviteUrl = `${base}/signup?workspace_invite=${member.id}`
    const workspaceName = workspace?.name || 'a workspace'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'invites@datamind.ai',
      to: email,
      subject: `You've been invited to ${workspaceName} on DataMind AI`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px">
      <div style="color:#fff;font-size:22px;font-weight:700">DataMind AI</div>
      <div style="color:#c4b5fd;font-size:13px;margin-top:4px">Workspace Invitation</div>
    </div>
    <div style="padding:28px 32px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">You've been invited!</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
        You've been invited to join <strong>${workspaceName}</strong> on DataMind AI as a <strong>${role}</strong>.
      </p>
      <a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:13px;font-weight:600">
        Accept Invitation →
      </a>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc">
      <p style="margin:0;font-size:11px;color:#94a3b8">
        If you didn't expect this invitation, you can ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`,
    }).catch(err => console.error('[workspace-invite] Email send failed:', err.message))
  }

  return res.status(201).json({ member })
}
