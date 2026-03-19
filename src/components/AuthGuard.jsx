import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export default function AuthGuard({ children }) {
  const { user, loading, supabaseEnabled } = useAuth()

  // If Supabase is not configured, allow access (dev/demo mode)
  if (!supabaseEnabled) return children

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return children
}
