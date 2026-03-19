import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  supabaseEnabled: false
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabaseEnabled = !!supabase

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, supabaseEnabled }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
