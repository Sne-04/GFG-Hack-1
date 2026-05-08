/**
 * Auth verification re-export.
 * Migrated from Supabase to Clerk.
 * This file maintains backward compatibility for all API routes.
 */
export { verifyAuth, AuthError } from './clerk.js'
