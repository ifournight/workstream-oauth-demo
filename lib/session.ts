import { getIronSession, type IronSession } from 'iron-session'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Session data structure
 */
export interface SessionData {
  accessToken?: string
  refreshToken?: string
  identityId?: string
  expiresAt?: number
}

/**
 * Session options for iron-session
 */
export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'default-secret-key-must-be-at-least-32-characters-long',
  cookieName: 'auth_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax' as const,
  },
}

/**
 * Get session from cookies (for App Router)
 * @param cookieStore Optional cookie store (defaults to cookies() from next/headers)
 * @returns Session object
 */
export async function getSession(
  cookieStore?: ReadonlyRequestCookies
): Promise<IronSession<SessionData>> {
  const cookieStoreToUse = cookieStore || (await import('next/headers').then(m => m.cookies()))
  return await getIronSession<SessionData>(cookieStoreToUse, sessionOptions)
}

/**
 * Create or update session with access token
 * @param cookieStore Optional cookie store
 * @param accessToken Access token to store
 * @param refreshToken Optional refresh token
 * @param expiresIn Optional expiration time in seconds
 */
export async function createSession(
  cookieStore: ReadonlyRequestCookies,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
): Promise<void> {
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  
  session.accessToken = accessToken
  if (refreshToken) {
    session.refreshToken = refreshToken
  }
  
  // Calculate expiration time
  if (expiresIn) {
    session.expiresAt = Date.now() + expiresIn * 1000
  }
  
  // Extract identity ID from token
  try {
    const { getIdentityIdFromToken } = await import('./jwt')
    session.identityId = getIdentityIdFromToken(accessToken) || undefined
  } catch (error) {
    console.warn('Failed to extract identity ID from token:', error)
  }
  
  await session.save()
}

/**
 * Clear session (logout)
 * @param cookieStore Optional cookie store
 */
export async function clearSession(
  cookieStore?: ReadonlyRequestCookies
): Promise<void> {
  const cookieStoreToUse = cookieStore || (await import('next/headers').then(m => m.cookies()))
  const session = await getIronSession<SessionData>(cookieStoreToUse, sessionOptions)
  session.destroy()
}

/**
 * Check if session is valid (not expired)
 * @param cookieStore Optional cookie store
 * @returns true if session is valid, false otherwise
 */
export async function isSessionValid(
  cookieStore?: ReadonlyRequestCookies
): Promise<boolean> {
  try {
    const session = await getSession(cookieStore)
    
    if (!session.accessToken) {
      return false
    }
    
    // Check if token is expired
    if (session.expiresAt && Date.now() >= session.expiresAt) {
      return false
    }
    
    // Also check token expiration using JWT
    try {
      const { isTokenExpired } = await import('./jwt')
      if (isTokenExpired(session.accessToken)) {
        return false
      }
    } catch {
      // If we can't check, assume valid if expiresAt is not reached
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Get current user identity ID from session
 * @param cookieStore Optional cookie store
 * @returns Identity ID or null
 */
export async function getIdentityIdFromSession(
  cookieStore?: ReadonlyRequestCookies
): Promise<string | null> {
  try {
    const session = await getSession(cookieStore)
    return session.identityId || null
  } catch (error) {
    // Session decryption failed (e.g., SESSION_SECRET changed)
    // Clear the invalid cookie
    console.warn('Failed to decrypt session in getIdentityIdFromSession, clearing invalid cookie:', error)
    try {
      const cookieStoreToUse = cookieStore || (await import('next/headers').then(m => m.cookies()))
      const invalidSession = await getIronSession<SessionData>(cookieStoreToUse, sessionOptions)
      invalidSession.destroy()
    } catch (clearError) {
      console.error('Failed to clear invalid session:', clearError)
    }
    return null
  }
}
