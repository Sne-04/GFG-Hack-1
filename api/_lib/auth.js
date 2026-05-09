/**
 * Auth verification re-export.
 * Auth middleware — verifies Clerk JWT tokens for API routes.
 * This file maintains backward compatibility for all API routes.
 */
export { verifyAuth, AuthError } from './clerk.js'
