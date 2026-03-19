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
