import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, getProfile } from '../utils/supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  supabaseEnabled: false,
  plan: 'free',
  usage: null,
  refreshPlan: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState('free')
  const [usage, setUsage] = useState(null)
  const [supabaseReachable, setSupabaseReachable] = useState(true)
  const supabaseEnabled = !!supabase && supabaseReachable

  // Fetch user's plan and daily usage from Supabase.
  // Reads from profiles table first, falls back to user_metadata
  // (user_metadata is always writable by the user — no RLS restriction).
  const refreshPlan = useCallback(async (userId) => {
    if (!supabase || !userId) return

    try {
      // 1. Read profiles table
      const profile = await getProfile(userId)

      // 2. Read user_metadata (fallback — set by activatePlanClient when DB write is blocked)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const meta = authUser?.user_metadata || {}

      // Prefer DB plan; fall back to metadata plan
      const activePlan = (profile?.plan && profile.plan !== 'free') ? profile.plan : meta?.plan
      const expiresAt = profile?.plan_expires_at || meta?.plan_expires_at

      if (activePlan && activePlan !== 'free') {
        if (expiresAt && new Date(expiresAt) < new Date()) {
          setPlan('free') // expired
        } else {
          setPlan(activePlan)
        }
      } else {
        setPlan('free')
      }

      // Get today's usage count
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase
        .from('api_usage')
        .select('query_count')
        .eq('user_id', userId)
        .eq('month', today)
        .single()

      setUsage({ today_count: usageData?.query_count || 0 })
    } catch {
      setPlan('free')
      setUsage({ today_count: 0 })
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) refreshPlan(u.id)
      setLoading(false)
    }).catch(() => {
      // Supabase unreachable (network/CORS issue) — load app in guest/demo mode
      setSupabaseReachable(false)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) refreshPlan(u.id)
      else {
        setPlan('free')
        setUsage(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshPlan])

  return (
    <AuthContext.Provider value={{ user, loading, supabaseEnabled, plan, usage, refreshPlan }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
