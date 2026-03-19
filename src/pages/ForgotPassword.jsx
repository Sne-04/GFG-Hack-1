import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '../utils/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true)
    setError('')
    try {
      if (!supabase) throw new Error('Auth service not available')
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (resetError) throw resetError
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-8 max-w-md w-full text-center border border-white/5">
          <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-sm text-slate-400 mb-2">
            We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            If you don't see it, check your spam folder. The link expires in 1 hour.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/login" className="glow-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white inline-flex items-center justify-center gap-2">
              Back to Login <ArrowRight size={14} />
            </Link>
            <button onClick={() => { setSuccess(false); setEmail('') }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Didn't receive it? Try again
            </button>
          </div>
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
          <h1 className="text-2xl font-bold text-white mb-1">Reset your password</h1>
          <p className="text-sm text-slate-400 mb-6">Enter your email and we'll send you a reset link</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Email</label>
              <div className="flex items-center glass rounded-lg px-3 focus-within:ring-1 focus-within:ring-primary/40">
                <Mail size={14} className="text-slate-500 shrink-0" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 bg-transparent py-2.5 px-2 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full glow-btn rounded-xl py-3 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="animate-pulse">Sending...</span> : <>Send Reset Link <ArrowRight size={14} /></>}
            </button>
          </form>

          <Link to="/login" className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-6">
            <ArrowLeft size={12} /> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
