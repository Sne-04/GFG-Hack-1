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
  const supabaseEnabled = !!supabase

  // Fetch user's plan and daily usage from Supabase
  const refreshPlan = useCallback(async (userId) => {
    if (!supabase || !userId) return

    try {
      // Get profile (has plan field)
      const profile = await getProfile(userId)
      if (profile?.plan) {
        // Check if plan has expired
        if (profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date()) {
          setPlan('free')
        } else {
          setPlan(profile.plan)
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
