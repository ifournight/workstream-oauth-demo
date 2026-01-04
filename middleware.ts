import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/session'

/**
 * Middleware to protect routes that require authentication
 * Public routes: /login, /api/auth/*
 * All other routes require authentication
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  // Allow /clients and /api/clients for client management (needed before login)
  const publicRoutes = [
    '/login', 
    '/clients', 
    '/api/auth/login', 
    '/api/auth/callback',
    '/api/clients', // Allow client management API
  ]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // API auth routes are always public
  const isAuthApiRoute = pathname.startsWith('/api/auth/')

  // Allow public routes and auth API routes
  if (isPublicRoute || isAuthApiRoute) {
    return NextResponse.next()
  }

  // Check if session is valid
  try {
    const sessionCookie = request.cookies.get('auth_session')
    
    if (!sessionCookie) {
      // No session cookie, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('return_url', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Try to decrypt and validate session
    // If SESSION_SECRET changed, this will fail and we'll clear the invalid cookie
    try {
      const cookieValue = sessionCookie.value
      
      // Use unsealData to decrypt the session cookie
      const session = await unsealData<{ accessToken?: string; identityId?: string; expiresAt?: number }>(
        cookieValue,
        {
          password: sessionOptions.password,
        }
      )
      
      // Check if session has access token (indicates valid session)
      if (!session.accessToken) {
        // Session exists but has no access token - clear and redirect
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth_session')
        return response
      }
      
      // Session is valid, allow through
      return NextResponse.next()
    } catch (decryptError) {
      // Session decryption failed (e.g., SESSION_SECRET changed)
      // Clear invalid cookie and redirect to login
      console.warn('Session decryption failed in middleware, clearing invalid cookie:', decryptError)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth_session')
      return response
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('return_url', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
