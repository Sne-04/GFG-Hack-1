import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../utils/supabase'

export default function UserMenu() {
  const { user, supabaseEnabled } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!supabaseEnabled || !user) return null

  const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 glass rounded-lg px-2.5 py-1.5 hover:border-white/20 transition-all">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white">
          {initials}
        </div>
        <span className="text-xs text-slate-300 hidden sm:block max-w-[100px] truncate">{name}</span>
        <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs font-medium text-white truncate">{name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="p-1">
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <LogOut size={12} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
