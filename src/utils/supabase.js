import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Auth and history features will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ── Auth helpers ──

export async function signUp(email, password, name) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard` }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ── Profile helpers ──

export async function upsertProfile(userId, profile) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getProfile(userId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

// ── Query history helpers ──

export async function saveQuery(userId, queryText, resultJson, csvName) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('queries')
    .insert({ user_id: userId, query_text: queryText, result_json: resultJson, csv_name: csvName })
    .select()
    .single()
  if (error) console.error('Failed to save query:', error)
  return data
}

export async function getRecentQueries(userId, limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('queries')
    .select('id, query_text, csv_name, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getQueryById(queryId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('queries')
    .select('*')
    .eq('id', queryId)
    .single()
  return data
}

// ── Dashboard / saved analysis helpers ──

export async function saveDashboard(userId, csvName, schema, resultJson, queryText) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      user_id: userId,
      csv_name: csvName,
      schema_json: schema,
      result_json: resultJson,
      query_text: queryText
    })
    .select()
    .single()
  if (error) console.error('Failed to save dashboard:', error)
  return data
}

export async function getSavedDashboards(userId, limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('dashboards')
    .select('id, csv_name, query_text, created_at, is_favorite')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getDashboardById(dashboardId) {
  if (!supabase) return null
  const { data } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single()
  return data
}

export async function toggleFavorite(dashboardId, isFavorite) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('dashboards')
    .update({ is_favorite: isFavorite })
    .eq('id', dashboardId)
    .select()
    .single()
  if (error) console.error('Failed to toggle favorite:', error)
  return data
}

export async function deleteDashboard(dashboardId) {
  if (!supabase) return null
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId)
  if (error) console.error('Failed to delete dashboard:', error)
  return !error
}

export async function renameDashboard(dashboardId, title) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('dashboards')
    .update({ title })
    .eq('id', dashboardId)
    .select()
    .single()
  if (error) console.error('Failed to rename dashboard:', error)
  return data
}

export async function generateShareToken(dashboardId) {
  if (!supabase) return null
  // Generate a UUID-style token using crypto.randomUUID if available
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  const { data, error } = await supabase
    .from('dashboards')
    .update({ share_token: token })
    .eq('id', dashboardId)
    .select('share_token')
    .single()
  if (error) console.error('Failed to generate share token:', error)
  return data?.share_token || null
}

export async function getDashboardByToken(token) {
  if (!supabase) return null
  const { data } = await supabase
    .from('dashboards')
    .select('*')
    .eq('share_token', token)
    .single()
  return data
}

// ── Plan activation (client-side, uses user's own session) ──

export async function activatePlanClient(userId, plan, billing) {
  if (!supabase) return null
  const now = new Date()
  const expiresAt = new Date(now)
  if (billing === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1)
  }
  return upsertProfile(userId, {
    plan,
    billing_period: billing,
    plan_expires_at: expiresAt.toISOString(),
  })
}

// ── Usage tracking helpers ──

export async function incrementDailyUsage(userId) {
  if (!supabase) return null
  const today = new Date().toISOString().split('T')[0]

  // Try to upsert — increment if exists, insert if not
  const { data: existing } = await supabase
    .from('api_usage')
    .select('id, query_count')
    .eq('user_id', userId)
    .eq('month', today)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('api_usage')
      .update({ query_count: existing.query_count + 1 })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) console.error('Failed to update usage:', error)
    return data
  } else {
    const { data, error } = await supabase
      .from('api_usage')
      .insert({ user_id: userId, month: today, query_count: 1 })
      .select()
      .single()
    if (error) console.error('Failed to insert usage:', error)
    return data
  }
}

export async function getDailyUsage(userId) {
  if (!supabase) return 0
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('api_usage')
    .select('query_count')
    .eq('user_id', userId)
    .eq('month', today)
    .single()
  return data?.query_count || 0
}
