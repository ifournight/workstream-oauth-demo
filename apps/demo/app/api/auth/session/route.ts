import { NextRequest, NextResponse } from 'next/server'
import { getSession, clearSession, createSession, isSessionValid } from '@/lib/session'
import { getIdentityIdFromToken, isTokenExpired, decodeAccessToken, getTokenExpiration } from '@/lib/jwt'

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    
    // Try to get session - if SESSION_SECRET changed, this will fail to decrypt
    let session
    try {
      session = await getSession(cookieStore)
    } catch (error) {
      // Session decryption failed (e.g., SESSION_SECRET changed)
      // Clear the invalid cookie
      console.warn('Failed to decrypt session, clearing invalid cookie:', error)
      try {
        await clearSession(cookieStore)
      } catch (clearError) {
        console.error('Failed to clear invalid session:', clearError)
      }
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }
    
    if (!session.accessToken) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }
    
    // Check if token is expired
    if (isTokenExpired(session.accessToken)) {
      // Clear expired session
      await clearSession(cookieStore)
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }
    
    // Get identity ID from token
    const identityId = getIdentityIdFromToken(session.accessToken) || session.identityId
    
    // Decode token payload for display (without sensitive data)
    let tokenPayload: Record<string, any> | undefined
    let tokenPreview: { prefix: string; suffix: string; length: number } | undefined
    
    try {
      const decoded = decodeAccessToken(session.accessToken)
      tokenPayload = decoded as Record<string, any>
      
      // Create token preview (first 10 and last 10 characters)
      const tokenLength = session.accessToken.length
      tokenPreview = {
        prefix: session.accessToken.substring(0, 10),
        suffix: session.accessToken.substring(tokenLength - 10),
        length: tokenLength,
      }
    } catch (error) {
      console.warn('Failed to decode token for display:', error)
    }
    
    // Calculate expires in seconds
    const expiresAt = session.expiresAt || getTokenExpiration(session.accessToken)
    const expiresIn = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : undefined
    
    return NextResponse.json({
      authenticated: true,
      user: {
        identityId,
      },
      tokenPreview,
      tokenPayload,
      expiresAt,
      expiresIn,
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Failed to get session', authenticated: false },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/session
 * Create or update session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken, expiresIn } = body
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      )
    }

    // Validate token format (basic JWT format check)
    const trimmedToken = accessToken.trim()
    if (!trimmedToken) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Check JWT format (should have three dot-separated parts)
    const parts = trimmedToken.split('.')
    if (parts.length !== 3 || parts.some(part => !part || part.length === 0)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Try to decode token to verify it's a valid JWT
    try {
      const decoded = decodeAccessToken(trimmedToken)
      
      // Check if token is expired
      if (isTokenExpired(trimmedToken)) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 400 }
        )
      }
    } catch (decodeError) {
      // If we can't decode the token, it's invalid
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }
    
    const cookieStore = await import('next/headers').then(m => m.cookies())
    
    // Calculate expiresIn from token if not provided
    let tokenExpiresIn = expiresIn
    if (!tokenExpiresIn) {
      const expiration = getTokenExpiration(trimmedToken)
      if (expiration) {
        tokenExpiresIn = Math.max(0, Math.floor((expiration - Date.now()) / 1000))
      }
    }
    
    await createSession(cookieStore, trimmedToken, refreshToken, tokenExpiresIn)
    
    const identityId = getIdentityIdFromToken(trimmedToken)
    
    return NextResponse.json({
      success: true,
      user: {
        identityId,
      },
    })
  } catch (error) {
    console.error('Error creating session:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // If it's a known validation error, return it
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth/session
 * Clear session (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    await clearSession(cookieStore)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    )
  }
}
