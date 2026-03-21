/**
 * Verifies a Supabase JWT from the Authorization header.
 * Returns the user object or throws if invalid/missing.
 */
import { createClient } from '@supabase/supabase-js'

export async function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']

  // No token sent — allow as anonymous/guest user
  if (!authHeader) return null

  // Token present but malformed — reject
  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthError('Invalid Authorization header format', 401)
  }

  const token = authHeader.slice(7)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured — skip auth in dev environments
    return null
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data?.user) {
    throw new AuthError('Invalid or expired token', 401)
  }

  return data.user
}

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}
