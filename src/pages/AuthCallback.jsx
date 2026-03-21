import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'

/**
 * Handles Supabase OAuth callback.
 * Supabase redirects here after Google/GitHub sign-in with either:
 *  - Hash fragment:  /auth/callback#access_token=...
 *  - Query param:   /auth/callback?code=...  (PKCE flow)
 * Supabase JS v2 auto-detects both via detectSessionInUrl=true.
 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      navigate('/dashboard')
      return
    }

    // Supabase JS automatically exchanges the code/token on getSession()
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('[AuthCallback] session error:', sessionError.message)
        setError(sessionError.message)
        return
      }

      if (session) {
        // Authenticated — go to dashboard
        navigate('/dashboard', { replace: true })
      } else {
        // No session found — send back to login
        navigate('/login?error=auth_failed', { replace: true })
      }
    })
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-red-400 text-sm mb-4">Authentication failed: {error}</p>
          <a href="/login" className="text-primary underline text-sm">Back to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
