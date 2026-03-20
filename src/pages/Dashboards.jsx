import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Star, Trash2, Share2, BarChart2, Clock, FileSpreadsheet, ArrowLeft, Copy, Check, Pencil, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  getSavedDashboards,
  getDashboardById,
  toggleFavorite,
  deleteDashboard,
  renameDashboard,
  generateShareToken,
} from '../utils/supabase'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Dashboards() {
  const { user, supabaseEnabled } = useAuth()
  const navigate = useNavigate()
  const [dashboards, setDashboards] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareState, setShareState] = useState({}) // { [id]: { loading, copied, link } }
  const [renameState, setRenameState] = useState({}) // { [id]: string | null }
  const [deletingId, setDeletingId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'favorites'

  const load = useCallback(async () => {
    if (!user || !supabaseEnabled) { setLoading(false); return }
    setLoading(true)
    const data = await getSavedDashboards(user.id, 50)
    setDashboards(data)
    setLoading(false)
  }, [user, supabaseEnabled])

  useEffect(() => { load() }, [load])

  const handleToggleFav = async (id, current) => {
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, is_favorite: !current } : d))
    await toggleFavorite(id, !current)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this dashboard? This cannot be undone.')) return
    setDeletingId(id)
    await deleteDashboard(id)
    setDashboards(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  const handleRename = async (id, title) => {
    if (!title?.trim()) { setRenameState(p => ({ ...p, [id]: null })); return }
    setDashboards(prev => prev.map(d => d.id === id ? { ...d, title } : d))
    setRenameState(p => ({ ...p, [id]: null }))
    await renameDashboard(id, title.trim())
  }

  const handleShare = async (id) => {
    setShareState(p => ({ ...p, [id]: { loading: true } }))
    try {
      const token = await generateShareToken(id)
      if (token) {
        const link = `${window.location.origin}/shared/${token}`
        setShareState(p => ({ ...p, [id]: { loading: false, link, copied: false } }))
      } else {
        // Supabase missing share_token column — show a friendly message
        setShareState(p => ({ ...p, [id]: { loading: false, error: 'Sharing requires the share_token column in your dashboards table.' } }))
      }
    } catch {
      setShareState(p => ({ ...p, [id]: { loading: false, error: 'Could not generate share link.' } }))
    }
  }

  const handleCopy = (id, link) => {
    navigator.clipboard.writeText(link).then(() => {
      setShareState(p => ({ ...p, [id]: { ...p[id], copied: true } }))
      setTimeout(() => setShareState(p => ({ ...p, [id]: { ...p[id], copied: false } })), 2000)
    })
  }

  const handleOpen = async (id) => {
    const full = await getDashboardById(id)
    if (!full) return
    // Pass via sessionStorage so Dashboard can restore state
    sessionStorage.setItem('datamind-restore', JSON.stringify({
      result: full.result_json,
      query: full.query_text,
      csvName: full.csv_name,
      schema: full.schema_json,
    }))
    navigate('/dashboard')
  }

  const visible = filter === 'favorites'
    ? dashboards.filter(d => d.is_favorite)
    : dashboards

  return (
    <div className="min-h-screen bg-[#08080c] text-slate-200">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#08080c]/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Database size={14} className="text-white" />
          </div>
          <h1 className="text-base font-bold">My Dashboards</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filter === 'all' ? 'bg-primary/20 text-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            All ({dashboards.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${filter === 'favorites' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Star size={11} /> Favorites ({dashboards.filter(d => d.is_favorite).length})
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* Not signed in */}
        {!loading && !supabaseEnabled && (
          <div className="text-center py-24">
            <Database size={40} className="text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Sign in to view your history</h2>
            <p className="text-sm text-slate-500 mb-6">Your saved dashboards will appear here after you sign in.</p>
            <Link to="/login" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-block">Sign in</Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && supabaseEnabled && visible.length === 0 && (
          <div className="text-center py-24">
            <BarChart2 size={40} className="text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No saved dashboards yet'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {filter === 'favorites'
                ? 'Star a dashboard to find it here quickly.'
                : 'Upload a CSV, run a query, and click Save to store your analysis.'}
            </p>
            <Link to="/dashboard" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-block">
              Create a dashboard
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {visible.map((d, i) => {
                const share = shareState[d.id] || {}
                const renaming = renameState[d.id] !== undefined && renameState[d.id] !== null
                const title = d.title || d.query_text || 'Untitled Dashboard'

                return (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl border border-white/5 overflow-hidden hover:border-primary/20 transition-all group"
                  >
                    {/* Preview bar */}
                    <div className="h-1.5 bg-gradient-to-r from-primary/60 to-secondary/40" />

                    <div className="p-4">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        {renaming ? (
                          <input
                            autoFocus
                            defaultValue={d.title || d.query_text}
                            className="flex-1 text-sm bg-white/5 border border-primary/30 rounded-lg px-2 py-1 outline-none text-white text-sm"
                            onBlur={e => handleRename(d.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(d.id, e.target.value)
                              if (e.key === 'Escape') setRenameState(p => ({ ...p, [d.id]: null }))
                            }}
                          />
                        ) : (
                          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 flex-1">{title}</h3>
                        )}
                        <button
                          onClick={() => handleToggleFav(d.id, d.is_favorite)}
                          aria-label={d.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          className={`shrink-0 transition-colors ${d.is_favorite ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                        >
                          <Star size={14} fill={d.is_favorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mb-4 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1"><FileSpreadsheet size={10} />{d.csv_name || 'Unknown file'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(d.created_at)}</span>
                      </div>

                      {/* Share link */}
                      <AnimatePresence>
                        {share.link && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mb-3 flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2 py-1.5"
                          >
                            <span className="text-[10px] text-primary truncate flex-1">{share.link}</span>
                            <button onClick={() => handleCopy(d.id, share.link)} aria-label="Copy share link" className="shrink-0 text-primary hover:text-white transition-colors">
                              {share.copied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                            <button onClick={() => setShareState(p => ({ ...p, [d.id]: {} }))} aria-label="Close share link" className="shrink-0 text-slate-500 hover:text-slate-300">
                              <X size={12} />
                            </button>
                          </motion.div>
                        )}
                        {share.error && (
                          <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-[10px] text-red-400 mb-3"
                          >
                            {share.error}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpen(d.id)}
                          className="flex-1 glow-btn rounded-lg py-1.5 text-xs font-semibold text-white"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => setRenameState(p => ({ ...p, [d.id]: d.title || d.query_text || '' }))}
                          aria-label="Rename dashboard"
                          className="glass rounded-lg p-1.5 text-slate-500 hover:text-slate-200 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleShare(d.id)}
                          aria-label="Share dashboard"
                          disabled={share.loading}
                          className="glass rounded-lg p-1.5 text-slate-500 hover:text-primary transition-colors disabled:opacity-40"
                        >
                          {share.loading ? <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" /> : <Share2 size={13} />}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          aria-label="Delete dashboard"
                          disabled={deletingId === d.id}
                          className="glass rounded-lg p-1.5 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
