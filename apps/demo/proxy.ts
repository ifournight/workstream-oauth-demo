import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/session'
import { locales, defaultLocale, type Locale } from './i18n'

// Create the i18n middleware
// next-intl uses 'NEXT_LOCALE' cookie by default (Next.js standard)
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never', // Don't show locale in URL, use cookie/header instead
  localeDetection: true, // Enable automatic locale detection from cookie/header
  // next-intl automatically reads NEXT_LOCALE cookie when localeDetection is true
})

/**
 * Proxy function to protect routes that require authentication
 * Public routes: /login, /api/auth/*
 * All other routes require authentication
 * 
 * Note: In Next.js 16, middleware is deprecated in favor of proxy
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip i18n for API routes - they don't need localization
  if (pathname.startsWith('/api/')) {
    // For API routes, just handle authentication if needed
    // API auth routes are always public
    // All API routes are public for now (authentication is handled in the route handlers)
    return NextResponse.next()
  }

  // Then, handle authentication first (before i18n)
  // Public routes that don't require authentication
  const publicRoutes = [
    '/login', 
    '/clients', 
  ]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // For non-public routes, check authentication
  if (!isPublicRoute) {
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
          const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
          redirectResponse.cookies.delete('auth_session')
          return redirectResponse
        }
      } catch (decryptError) {
        // Session decryption failed (e.g., SESSION_SECRET changed)
        // Clear invalid cookie and redirect to login
        console.warn('Session decryption failed in proxy, clearing invalid cookie:', decryptError)
        const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
        redirectResponse.cookies.delete('auth_session')
        return redirectResponse
      }
    } catch (error) {
      console.error('Proxy error:', error)
      // On error, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('return_url', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Finally, handle i18n routing
  // next-intl automatically detects locale from NEXT_LOCALE cookie or Accept-Language header
  // This should be last so it doesn't interfere with authentication redirects
  try {
    const intlResponse = intlMiddleware(request)
    
    // If intl middleware redirects, return early
    if (intlResponse.status === 307 || intlResponse.status === 308) {
      return intlResponse
    }
    
    // Check if intlMiddleware has x-middleware-rewrite header (this would break routing with localePrefix: 'never')
    const rewriteHeader = intlResponse.headers.get('x-middleware-rewrite')
    if (rewriteHeader) {
      // Create a new response without the rewrite header to avoid routing issues
      const response = NextResponse.next()
      
      // Copy all headers from intl response (but skip rewrite header)
      // This includes x-next-intl-locale which getLocale() needs
      intlResponse.headers.forEach((value: string, key: string) => {
        if (key !== 'x-middleware-rewrite') {
          response.headers.set(key, value)
        }
      })
      
      return response
    }
    
    // If no rewrite header, use the intl response directly
    return intlResponse
  } catch (error) {
    console.error('[Proxy] Error in intlMiddleware:', error)
    // If intl middleware fails, just continue without it
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api/ (API routes - handled separately)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

