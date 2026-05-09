/**
 * Neon PostgreSQL serverless client.
 * Uses @neondatabase/serverless for Vercel Edge/Serverless compatibility.
 */
import { neon } from '@neondatabase/serverless'

let _sql = null

/**
 * Returns a cached Neon SQL tagged-template function.
 * Usage: const rows = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`
 */
export function getSQL() {
  if (_sql) return _sql
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL not configured. Set it in your .env or Vercel environment variables.')
  }
  _sql = neon(dbUrl)
  return _sql
}

/**
 * Helper: Run a query and return the first row or null.
 */
export async function queryOne(query, ...params) {
  const sql = getSQL()
  const rows = await sql(query, ...params)
  return rows[0] || null
}
