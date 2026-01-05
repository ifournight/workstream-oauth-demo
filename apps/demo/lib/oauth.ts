import { createHash, randomBytes } from 'crypto';

/**
 * PKCE helper functions for OAuth 2.0
 */

/**
 * Generate a random code verifier for PKCE
 * @returns A URL-safe base64 string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  // Generate a random 43-128 character URL-safe string
  const length = 43 + Math.floor(Math.random() * 86); // 43-128 characters
  const bytes = randomBytes(length);
  // Convert to base64url (RFC 7636)
  return bytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, length);
}

/**
 * Generate a code challenge from a code verifier
 * @param verifier The code verifier
 * @returns SHA256 hash of verifier, base64url encoded
 */
export function generateCodeChallenge(verifier: string): string {
  // SHA256 hash of verifier, then base64url encode
  const hash = createHash('sha256').update(verifier).digest();
  return hash.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate a random state string for OAuth
 * @returns A random state string
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

