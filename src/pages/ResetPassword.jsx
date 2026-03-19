import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, Lock, ArrowRight, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '../utils/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase handles the token exchange automatically via the URL hash
    if (!supabase) {
      setValidToken(false)
      return
    }
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidToken(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirmPassword) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      if (!supabase) throw new Error('Auth service not available')
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      // Auto-redirect after 3s
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.')
    }
    setLoading(false)
  }

  if (!validToken) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid or expired link</h2>
          <p className="text-sm text-slate-400 mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
          <Link to="/forgot-password" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-2">
            Request New Link <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Password updated!</h2>
          <p className="text-sm text-slate-400 mb-6">Your password has been reset successfully. Redirecting to dashboard...</p>
          <Link to="/dashboard" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-flex items-center gap-2">
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Database size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">DataMind AI</span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold text-white mb-1">Set new password</h1>
          <p className="text-sm text-slate-400 mb-6">Choose a strong password for your account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">New Password</label>
              <div className="flex items-center glass rounded-lg px-3 focus-within:ring-1 focus-within:ring-primary/40">
                <Lock size={14} className="text-slate-500 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-500 hover:text-slate-300" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Confirm Password</label>
              <div className="flex items-center glass rounded-lg px-3 focus-within:ring-1 focus-within:ring-primary/40">
                <Lock size={14} className="text-slate-500 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>

            {password && (
              <div className="space-y-1">
                <div className={`flex items-center gap-1.5 text-xs ${password.length >= 6 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 6 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  At least 6 characters
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${password === confirmPassword && confirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${password === confirmPassword && confirmPassword ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  Passwords match
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full glow-btn rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="animate-pulse">Updating...</span> : <>Update Password <ArrowRight size={14} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
