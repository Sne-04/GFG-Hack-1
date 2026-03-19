import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown, Settings, Shield, CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../utils/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { getPlan } from '../utils/quota'

export default function UserMenu() {
  const { user, supabaseEnabled, plan: userPlan } = useAuth()
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
  const email = user.email || ''
  const avatarUrl = user.user_metadata?.avatar_url || null
  const planConfig = getPlan(userPlan)
  const plan = planConfig.name

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
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2.5 glass rounded-xl px-3 py-2 hover:border-primary/20 transition-all group w-full">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/30" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-primary/20">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0 text-left hidden sm:block">
          <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">{name}</p>
          <p className="text-[9px] text-slate-500 truncate leading-tight">{plan} Plan</p>
        </div>
        <ChevronDown size={12} className={`text-slate-500 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 bottom-full mb-2 w-56 rounded-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-[100]"
            style={{ background: '#13141f' }}
          >
            {/* Profile header */}
            <div className="p-3.5 border-b border-white/5">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{email}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  {plan}
                </span>
                <span className="text-[9px] text-slate-500">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <button onClick={() => { setOpen(false); navigate('/settings?tab=profile') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors">
                <User size={13} className="text-slate-500" /> My Profile
              </button>
              <button onClick={() => { setOpen(false); navigate('/settings?tab=settings') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors">
                <Settings size={13} className="text-slate-500" /> Settings
              </button>
              <button onClick={() => { setOpen(false); navigate('/settings?tab=billing') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors">
                <CreditCard size={13} className="text-slate-500" /> Billing & Plan
              </button>
              <button onClick={() => { setOpen(false); navigate('/settings?tab=security') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-lg transition-colors">
                <Shield size={13} className="text-slate-500" /> Privacy & Security
              </button>
            </div>

            {/* Sign out */}
            <div className="border-t border-white/5 p-1.5">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium">
                <LogOut size={13} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
