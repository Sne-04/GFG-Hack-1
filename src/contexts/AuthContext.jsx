/**
 * AuthContext — powered by Clerk + Neon PostgreSQL.
 * Provides user, plan, usage, and auth state to the entire app.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { getProfile, getDailyUsage } from '../utils/db'

const AuthContext = createContext({
  user: null,
  loading: true,
  clerkEnabled: true,
  dbEnabled: true,
  plan: 'free',
  usage: null,
  refreshPlan: () => {},
  getToken: () => null,
})

export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const [plan, setPlan] = useState('free')
  const [usage, setUsage] = useState(null)

  // Normalize Clerk user shape for backward compat
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    user_metadata: {
      name: clerkUser.fullName || clerkUser.firstName || '',
      avatar_url: clerkUser.imageUrl || null,
    },
    created_at: clerkUser.createdAt,
  } : null

  // Make Clerk session token available globally for fetch calls
  useEffect(() => {
    if (typeof window !== 'undefined' && clerkUser) {
      window.Clerk = { session: { getToken } }
    }
  }, [clerkUser, getToken])

  // Fetch user's plan and daily usage from Neon (via API routes)
  const refreshPlan = useCallback(async (userId) => {
    if (!userId) return

    try {
      const profile = await getProfile(userId)
      const activePlan = profile?.plan || 'free'
      const expiresAt = profile?.plan_expires_at

      if (activePlan && activePlan !== 'free') {
        if (expiresAt && new Date(expiresAt) < new Date()) {
          setPlan('free') // expired
        } else {
          setPlan(activePlan)
        }
      } else {
        setPlan('free')
      }

      const todayCount = await getDailyUsage(userId)
      setUsage({ today_count: todayCount })
    } catch {
      setPlan('free')
      setUsage({ today_count: 0 })
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && clerkUser) {
      refreshPlan(clerkUser.id)
    } else {
      setPlan('free')
      setUsage(null)
    }
  }, [isLoaded, isSignedIn, clerkUser, refreshPlan])

  return (
    <AuthContext.Provider value={{
      user,
      loading: !isLoaded,
      clerkEnabled: true,
      // Backward compat: maps to clerkEnabled so AuthGuard works properly
      dbEnabled: true,
      plan,
      usage,
      refreshPlan,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
