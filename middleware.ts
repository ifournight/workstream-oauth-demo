import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    // In middleware, we need to check cookies directly
    // iron-session requires a cookie store, but middleware has limited access
    // So we check for the session cookie existence and basic validation
    const sessionCookie = request.cookies.get('auth_session')
    
    if (!sessionCookie) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('return_url', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If cookie exists, allow through (full validation happens in API routes)
    return NextResponse.next()
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
