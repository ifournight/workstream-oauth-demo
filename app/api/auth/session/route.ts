import { NextRequest, NextResponse } from 'next/server'
import { getSession, clearSession, createSession, isSessionValid } from '@/lib/session'
import { getIdentityIdFromToken, isTokenExpired } from '@/lib/jwt'

/**
 * GET /api/auth/session
 * Get current user session
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const session = await getSession(cookieStore)
    
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
    
    return NextResponse.json({
      authenticated: true,
      user: {
        identityId,
      },
      expiresAt: session.expiresAt,
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
    
    const cookieStore = await import('next/headers').then(m => m.cookies())
    await createSession(cookieStore, accessToken, refreshToken, expiresIn)
    
    const identityId = getIdentityIdFromToken(accessToken)
    
    return NextResponse.json({
      success: true,
      user: {
        identityId,
      },
    })
  } catch (error) {
    console.error('Error creating session:', error)
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
