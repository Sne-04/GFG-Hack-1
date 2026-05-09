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
} from '../utils/db'

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
  const { user, dbEnabled } = useAuth()
  const navigate = useNavigate()
  const [dashboards, setDashboards] = useState([])
  const [loading, setLoading] = useState(true)
  const [shareState, setShareState] = useState({}) // { [id]: { loading, copied, link } }
  const [renameState, setRenameState] = useState({}) // { [id]: string | null }
  const [deletingId, setDeletingId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'favorites'

  const load = useCallback(async () => {
    if (!user || !dbEnabled) { setLoading(false); return }
    setLoading(true)
    const data = await getSavedDashboards(user.id, 50)
    setDashboards(data)
    setLoading(false)
  }, [user, dbEnabled])

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
        // DB missing share_token column — show a friendly message
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
    <div className="min-h-screen bg-transparent text-slate-800">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <Database size={14} className="text-white" />
          </div>
          <h1 className="text-base font-bold text-slate-900">My Dashboards</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${filter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            All ({dashboards.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${filter === 'favorites' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <Star size={12} className={filter === 'favorites' ? 'fill-amber-500 text-amber-500' : ''} /> Favorites ({dashboards.filter(d => d.is_favorite).length})
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
        {!loading && !dbEnabled && (
          <div className="text-center py-24 max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Database size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your history</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">Your saved dashboards will appear here after you sign in.</p>
            <Link to="/login" className="bg-slate-900 hover:bg-black transition-colors rounded-full px-8 py-3 text-sm font-semibold text-white inline-flex items-center shadow-lg shadow-slate-900/10">Sign in</Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && dbEnabled && visible.length === 0 && (
          <div className="text-center py-24 max-w-sm mx-auto">
            <div className="w-20 h-20 mx-auto bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <BarChart2 size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No saved dashboards yet'}
            </h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {filter === 'favorites'
                ? 'Star a dashboard to find it here quickly.'
                : 'Upload a CSV, run a query, and click Save to store your analysis.'}
            </p>
            <Link to="/dashboard" className="bg-slate-900 hover:bg-black transition-colors rounded-full px-8 py-3 text-sm font-semibold text-white inline-flex items-center shadow-lg shadow-slate-900/10">
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
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group shadow-sm flex flex-col"
                  >
                    {/* Preview bar */}
                    <div className="h-1.5 bg-gradient-to-r from-slate-800 to-slate-600" />

                    <div className="p-5 flex-1 flex flex-col">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        {renaming ? (
                          <input
                            autoFocus
                            defaultValue={d.title || d.query_text}
                            className="flex-1 text-sm bg-slate-50 border border-primary/30 rounded-lg px-3 py-1.5 outline-none text-slate-900 font-medium"
                            onBlur={e => handleRename(d.id, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleRename(d.id, e.target.value)
                              if (e.key === 'Escape') setRenameState(p => ({ ...p, [d.id]: null }))
                            }}
                          />
                        ) : (
                          <h3 className="text-[15px] font-bold text-slate-900 leading-tight line-clamp-2 flex-1 group-hover:text-primary transition-colors">{title}</h3>
                        )}
                        <button
                          onClick={() => handleToggleFav(d.id, d.is_favorite)}
                          aria-label={d.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          className={`shrink-0 transition-all ${d.is_favorite ? 'text-amber-500 hover:text-amber-600 scale-110' : 'text-slate-300 hover:text-amber-400'}`}
                        >
                          <Star size={16} className={d.is_favorite ? "fill-amber-500" : ""} />
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
                      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleOpen(d.id)}
                          className="flex-1 bg-slate-900 hover:bg-black transition-colors rounded-lg py-2 text-xs font-semibold text-white shadow-sm"
                        >
                          Open Dashboard
                        </button>
                        <button
                          onClick={() => setRenameState(p => ({ ...p, [d.id]: d.title || d.query_text || '' }))}
                          aria-label="Rename dashboard"
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleShare(d.id)}
                          aria-label="Share dashboard"
                          disabled={share.loading}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
                        >
                          {share.loading ? <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Share2 size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          aria-label="Delete dashboard"
                          disabled={deletingId === d.id}
                          className="bg-red-50 border border-red-100 rounded-lg p-2 text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={14} />
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
