/**
 * Access control utilities for global clients management
 * Uses Next.js recommended approach with server-side and client-side checks
 */

import { config } from './config'
import { getIdentityIdFromSession } from './session'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Check if an identity ID is in the global clients admin whitelist
 * @param identityId Identity ID to check
 * @returns true if the identity ID is in the whitelist
 */
export function isGlobalClientsAdmin(identityId: string | null | undefined): boolean {
  if (!identityId) {
    return false
  }
  
  return config.globalClientsAdminIdentityIds.includes(identityId)
}

/**
 * Server-side check: Get identity ID from session and check if user is admin
 * @param cookieStore Optional cookie store (defaults to cookies() from next/headers)
 * @returns true if the current user is a global clients admin
 */
export async function checkGlobalClientsAdminAccess(
  cookieStore?: ReadonlyRequestCookies
): Promise<boolean> {
  try {
    const identityId = await getIdentityIdFromSession(cookieStore)
    return isGlobalClientsAdmin(identityId)
  } catch (error) {
    console.error('Error checking global clients admin access:', error)
    return false
  }
}

