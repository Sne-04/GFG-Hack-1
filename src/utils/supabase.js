/**
 * Database client module — replaces Supabase client.
 * 
 * All database operations now go through API routes that use Neon PostgreSQL.
 * Auth is handled by Clerk (tokens attached automatically via ClerkProvider).
 * 
 * Client-side code no longer has direct DB access — it goes through /api/* routes.
 */

// ── Auth helper — get Clerk token for API calls ──

async function getAuthToken() {
  // Clerk exposes __clerk_db_jwt in cookies, but we use the session token
  // from window.Clerk (if available) for API calls
  if (typeof window !== 'undefined' && window.Clerk?.session) {
    try {
      const token = await window.Clerk.session.getToken()
      return token
    } catch {
      return null
    }
  }
  return null
}

async function authFetch(url, opts = {}) {
  const token = await getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return fetch(url, { ...opts, headers })
}

// ── Profile helpers (via API routes) ──

export async function upsertProfile(userId, profile) {
  try {
    const res = await authFetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ userId, ...profile }),
    })
    const json = await res.json()
    return json.profile || null
  } catch (err) {
    console.error('Failed to upsert profile:', err)
    return null
  }
}

export async function getProfile(userId) {
  try {
    const res = await authFetch(`/api/profiles?userId=${userId}`)
    const json = await res.json()
    return json.profile || null
  } catch {
    return null
  }
}

// ── Query history helpers ──

export async function saveQuery(userId, queryText, resultJson, csvName) {
  try {
    const res = await authFetch('/api/data/queries', {
      method: 'POST',
      body: JSON.stringify({ userId, queryText, resultJson, csvName }),
    })
    const json = await res.json()
    return json.query || null
  } catch (err) {
    console.error('Failed to save query:', err)
    return null
  }
}

export async function getRecentQueries(userId, limit = 20) {
  try {
    const res = await authFetch(`/api/data/queries?userId=${userId}&limit=${limit}`)
    const json = await res.json()
    return json.queries || []
  } catch {
    return []
  }
}

export async function getQueryById(queryId) {
  try {
    const res = await authFetch(`/api/data/queries?id=${queryId}`)
    const json = await res.json()
    return json.query || null
  } catch {
    return null
  }
}

// ── Dashboard helpers ──

export async function saveDashboard(userId, csvName, schema, resultJson, queryText) {
  try {
    const res = await authFetch('/api/data/dashboards', {
      method: 'POST',
      body: JSON.stringify({ userId, csvName, schema, resultJson, queryText }),
    })
    const json = await res.json()
    return json.dashboard || null
  } catch (err) {
    console.error('Failed to save dashboard:', err)
    return null
  }
}

export async function getDashboardCount(userId) {
  try {
    const res = await authFetch(`/api/data/dashboards?userId=${userId}&count=true`)
    const json = await res.json()
    return json.count || 0
  } catch {
    return 0
  }
}

export async function getSavedDashboards(userId, limit = 20) {
  try {
    const res = await authFetch(`/api/data/dashboards?userId=${userId}&limit=${limit}`)
    const json = await res.json()
    return json.dashboards || []
  } catch {
    return []
  }
}

export async function getDashboardById(dashboardId) {
  try {
    const res = await authFetch(`/api/data/dashboards?id=${dashboardId}`)
    const json = await res.json()
    return json.dashboard || null
  } catch {
    return null
  }
}

export async function toggleFavorite(dashboardId, isFavorite) {
  try {
    const res = await authFetch('/api/data/dashboards', {
      method: 'PATCH',
      body: JSON.stringify({ id: dashboardId, is_favorite: isFavorite }),
    })
    const json = await res.json()
    return json.dashboard || null
  } catch (err) {
    console.error('Failed to toggle favorite:', err)
    return null
  }
}

export async function deleteDashboard(dashboardId) {
  try {
    const res = await authFetch(`/api/data/dashboards?id=${dashboardId}`, {
      method: 'DELETE',
    })
    return res.ok
  } catch {
    return false
  }
}

export async function renameDashboard(dashboardId, title) {
  try {
    const res = await authFetch('/api/data/dashboards', {
      method: 'PATCH',
      body: JSON.stringify({ id: dashboardId, title }),
    })
    const json = await res.json()
    return json.dashboard || null
  } catch (err) {
    console.error('Failed to rename dashboard:', err)
    return null
  }
}

export async function generateShareToken(dashboardId) {
  try {
    const res = await authFetch('/api/data/dashboards', {
      method: 'PATCH',
      body: JSON.stringify({ id: dashboardId, generateShareToken: true }),
    })
    const json = await res.json()
    return json.dashboard?.share_token || null
  } catch (err) {
    console.error('Failed to generate share token:', err)
    return null
  }
}

export async function getDashboardByToken(token) {
  try {
    const res = await fetch(`/api/data/dashboards?shareToken=${token}`)
    const json = await res.json()
    return json.dashboard || null
  } catch {
    return null
  }
}

// ── Plan activation (client-side trigger) ──

export async function activatePlanClient(userId, plan, billing) {
  try {
    const res = await authFetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        plan,
        billing_period: billing,
        plan_expires_at: calcExpiry(billing),
      }),
    })
    const json = await res.json()
    return json.profile || null
  } catch (err) {
    console.error('Failed to activate plan:', err)
    return null
  }
}

function calcExpiry(billing) {
  const now = new Date()
  const expires = new Date(now)
  if (billing === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1)
  } else {
    expires.setMonth(expires.getMonth() + 1)
  }
  return expires.toISOString()
}

// ── Usage tracking ──

export async function incrementDailyUsage(userId) {
  try {
    const res = await authFetch('/api/data/usage', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
    const json = await res.json()
    return json.usage || null
  } catch (err) {
    console.error('Failed to increment usage:', err)
    return null
  }
}

export async function getDailyUsage(userId) {
  try {
    const res = await authFetch(`/api/data/usage?userId=${userId}`)
    const json = await res.json()
    return json.queryCount || 0
  } catch {
    return 0
  }
}

// ── Workspace helpers ──

export async function getWorkspaces() {
  try {
    const res = await authFetch('/api/workspaces')
    const json = await res.json()
    return json.workspaces || []
  } catch {
    return []
  }
}

// ── Scheduled report helpers ──

export async function getScheduledReports(dashboardId) {
  try {
    const url = dashboardId ? `/api/schedule-report?dashboard_id=${dashboardId}` : '/api/schedule-report'
    const res = await authFetch(url)
    const json = await res.json()
    return json.schedules || []
  } catch {
    return []
  }
}
