import { decodeJwt, jwtVerify, type JWTPayload } from 'jose'

/**
 * Decode JWT token without verification
 * @param token JWT token string
 * @returns Decoded JWT payload
 */
export function decodeAccessToken(token: string): JWTPayload {
  try {
    return decodeJwt(token)
  } catch (error) {
    throw new Error(`Failed to decode JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @param secret Secret key for verification (optional, if token is signed)
 * @returns Verified and decoded JWT payload
 */
export async function verifyAccessToken(
  token: string,
  secret?: string | Uint8Array
): Promise<JWTPayload> {
  try {
    if (secret) {
      const secretKey = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret
      const { payload } = await jwtVerify(token, secretKey)
      return payload
    } else {
      // If no secret provided, just decode (for unsigned tokens)
      return decodeJwt(token)
    }
  } catch (error) {
    throw new Error(`Failed to verify JWT token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract Identity ID (sub claim) from JWT token
 * @param token JWT token string
 * @returns Identity ID (sub) or null if not found
 */
export function getIdentityIdFromToken(token: string): string | null {
  try {
    const decoded = decodeAccessToken(token)
    return (decoded.sub as string) || null
  } catch {
    return null
  }
}

/**
 * Check if JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeAccessToken(token)
    const exp = decoded.exp
    
    if (!exp) {
      // If no expiration claim, consider it as not expired
      return false
    }
    
    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = exp * 1000
    return Date.now() >= expirationTime
  } catch {
    // If decoding fails, consider it as expired
    return true
  }
}

/**
 * Get token expiration time
 * @param token JWT token string
 * @returns Expiration timestamp in milliseconds, or null if no expiration
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = decodeAccessToken(token)
    const exp = decoded.exp
    
    if (!exp) {
      return null
    }
    
    return exp * 1000 // Convert to milliseconds
  } catch {
    return null
  }
}
