import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Mail, Trash2, Crown, Shield, Eye, Send, AlertCircle, Check, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../utils/supabase'
import Header from '../components/Header'

const ROLE_ICONS = { admin: Crown, editor: Shield, viewer: Eye }
const ROLE_COLORS = { admin: 'text-amber-400', editor: 'text-blue-400', viewer: 'text-slate-400' }

export default function Team() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [workspaces, setWorkspaces]   = useState([])
  const [selected, setSelected]       = useState(null) // active workspace
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  // Create workspace form
  const [showCreate, setShowCreate]   = useState(false)
  const [wsName, setWsName]           = useState('')
  const [creating, setCreating]       = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('viewer')
  const [inviting, setInviting]       = useState(false)

  const plan = profile?.plan || user?.user_metadata?.plan || 'free'
  const canUseTeams = plan === 'pro' || plan === 'enterprise'

  useEffect(() => { loadWorkspaces() }, [])

  async function getToken() {
    const s = await supabase.auth.getSession()
    return s?.data?.session?.access_token
  }

  async function loadWorkspaces() {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      const list = json.workspaces || []
      setWorkspaces(list)
      if (list.length > 0 && !selected) setSelected(list[0])
    } catch {
      setError('Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  async function createWorkspace(e) {
    e.preventDefault()
    if (!wsName.trim()) return
    setCreating(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: wsName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const updated = [...workspaces, { ...json.workspace, _role: 'admin', workspace_members: [] }]
      setWorkspaces(updated)
      setSelected(updated[updated.length - 1])
      setWsName('')
      setShowCreate(false)
      setSuccess('Workspace created!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function inviteMember(e) {
    e.preventDefault()
    if (!inviteEmail.trim() || !selected) return
    setInviting(true)
    setError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/workspace-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspace_id: selected.id, email: inviteEmail.trim(), role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setTimeout(() => setSuccess(''), 4000)
      loadWorkspaces()
    } catch (err) {
      setError(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function removeMember(memberId) {
    if (!confirm('Remove this member?')) return
    try {
      const token = await getToken()
      await fetch(`/api/workspace-invite?member_id=${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      loadWorkspaces()
    } catch {
      setError('Failed to remove member')
    }
  }

  const darkMode = true
  const border = 'border-white/10'
  const inputCls = 'w-full px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-white text-xs placeholder-slate-500 outline-none focus:border-primary/50 transition-all'

  const members = selected?.workspace_members || []

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Header darkMode={darkMode} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users size={18} className="text-primary" /> Team Workspaces
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Collaborate with your team on shared dashboards</p>
          </div>
        </div>

        {/* Plan gate */}
        {!canUseTeams && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 mb-6 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Pro or Enterprise plan required</p>
              <p className="text-xs text-slate-400 mt-1">Team workspaces are available on Pro (₹499/mo) and Enterprise plans.</p>
              <button onClick={() => navigate('/pricing')} className="mt-3 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-1.5 rounded-lg transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 mb-4">
            <AlertCircle size={13} /> {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 mb-4">
            <Check size={13} /> {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar: workspace list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Workspaces</p>
              {canUseTeams && (
                <button onClick={() => setShowCreate(true)} className="text-primary hover:text-primary/80 transition-colors">
                  <Plus size={14} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : workspaces.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                <Users size={20} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No workspaces yet</p>
              </div>
            ) : (
              workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setSelected(ws)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    selected?.id === ws.id
                      ? 'bg-primary/10 border-primary/30 text-white'
                      : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white bg-white/[0.02]'
                  }`}
                >
                  <div className="text-xs font-semibold truncate">{ws.name}</div>
                  <div className="text-[10px] mt-0.5 text-slate-500">
                    {(ws.workspace_members || []).filter(m => m.joined_at).length} member(s) · {ws._role}
                  </div>
                </button>
              ))
            )}

            {/* Create workspace form */}
            {showCreate && (
              <form onSubmit={createWorkspace} className="space-y-2 border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <input
                  autoFocus
                  value={wsName}
                  onChange={e => setWsName(e.target.value)}
                  placeholder="Workspace name"
                  className={inputCls}
                  required
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={creating} className="flex-1 bg-primary text-white text-xs py-2 rounded-lg font-medium disabled:opacity-50 transition-colors hover:bg-primary/80">
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-3 text-xs text-slate-400 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Main: members panel */}
          <div className="md:col-span-2 space-y-4">
            {selected ? (
              <>
                <div className={`border ${border} rounded-xl bg-white/[0.02]`}>
                  <div className={`flex items-center justify-between p-4 border-b ${border}`}>
                    <div>
                      <h2 className="text-sm font-bold">{selected.name}</h2>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {members.length} member(s) · Your role: <span className="text-primary">{selected._role}</span>
                      </p>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="divide-y divide-white/5">
                    {members.length === 0 ? (
                      <p className="text-xs text-slate-500 p-6 text-center">No members yet. Invite someone below.</p>
                    ) : members.map(m => {
                      const RoleIcon = ROLE_ICONS[m.role] || Eye
                      return (
                        <div key={m.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {(m.invited_email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-200">{m.invited_email}</div>
                              <div className={`flex items-center gap-1 text-[10px] ${ROLE_COLORS[m.role]}`}>
                                <RoleIcon size={9} />
                                {m.role}
                                {!m.joined_at && <span className="text-slate-500 ml-1">(pending)</span>}
                              </div>
                            </div>
                          </div>
                          {(selected._role === 'admin' || selected.owner_id === user?.id) && m.user_id !== user?.id && (
                            <button
                              onClick={() => removeMember(m.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1"
                              title="Remove member"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Invite form */}
                {(selected._role === 'admin' || selected.owner_id === user?.id) && (
                  <div className={`border ${border} rounded-xl p-4 bg-white/[0.02]`}>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Invite Member</p>
                    <form onSubmit={inviteMember} className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className={inputCls + ' flex-1'}
                        required
                      />
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className={inputCls + ' w-24'}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        <Send size={12} />
                        {inviting ? 'Sending...' : 'Invite'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className={`border ${border} rounded-xl p-12 text-center bg-white/[0.02]`}>
                <Users size={28} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Select or create a workspace to manage members</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
