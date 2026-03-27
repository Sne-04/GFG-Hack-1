import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronDown, Plus } from 'lucide-react'
import { supabase } from '../utils/supabase'

/**
 * WorkspacePicker — compact dropdown for the Dashboard sidebar
 * Shows the active workspace and lets users switch or go to /team
 */
export default function WorkspacePicker({ darkMode }) {
  const navigate = useNavigate()
  const [open, setOpen]             = useState(false)
  const [workspaces, setWorkspaces] = useState([])
  const [active, setActive]         = useState(null)
  const ref = useRef(null)

  useEffect(() => { loadWorkspaces() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadWorkspaces() {
    try {
      const s = await supabase.auth.getSession()
      const token = s?.data?.session?.access_token
      if (!token) return
      const res = await fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      const list = json.workspaces || []
      setWorkspaces(list)
      if (list.length > 0) setActive(list[0])
    } catch {
      // silently fail — workspaces are optional
    }
  }

  const border = darkMode ? 'border-white/10' : 'border-slate-200'
  const bg     = darkMode ? 'bg-[#0e0e1a]' : 'bg-white'

  if (workspaces.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
          darkMode
            ? 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users size={11} className="text-primary shrink-0" />
          <span className="truncate font-medium">{active?.name || 'Select workspace'}</span>
        </div>
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${bg} ${border}`}>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => { setActive(ws); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                active?.id === ws.id
                  ? 'bg-primary/10 text-primary'
                  : darkMode
                    ? 'text-slate-300 hover:bg-white/5'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium">{ws.name}</span>
              <span className="ml-1.5 text-[10px] text-slate-500">{ws._role}</span>
            </button>
          ))}
          <div className={`border-t ${border}`}>
            <button
              onClick={() => { setOpen(false); navigate('/team') }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${
                darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-50'
              } transition-colors`}
            >
              <Plus size={11} /> Manage workspaces
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
