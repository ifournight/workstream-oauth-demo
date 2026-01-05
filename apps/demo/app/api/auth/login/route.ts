import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { config, getBaseUrl } from '@/lib/config'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/oauth'
import { NextRequest } from 'next/server'

/**
 * GET /api/auth/login
 * Initialize login flow with PKCE
 * Redirects to Hydra authorization endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Use configured client ID or allow override
  const clientId = searchParams.get('client_id') || config.clientId
  const scope = searchParams.get('scope') || 'openid offline'
  
  // Use callback URL for login flow
  // Use /api/auth/callback as the redirect URI for login flow
  const baseUrl = getBaseUrl(request)
  const redirectUri = searchParams.get('redirect_uri') || 
    `${baseUrl}/api/auth/callback`
  
  // Debug logging
  console.log('[Login API] Base URL extraction:', {
    baseUrl,
    redirectUri,
    requestUrl: request.url,
    headers: {
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    },
    env: {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      VERCEL: process.env.VERCEL,
    },
  })
  
  // Get return URL (where to redirect after successful login)
  const returnUrl = searchParams.get('return_url') || '/'

  if (!clientId) {
    redirect('/login?error=missing_client_id')
  }
  
  if (!baseUrl || baseUrl === 'http://localhost:3000') {
    console.error('[Login API] Warning: baseUrl is localhost, this might be incorrect for Vercel deployment')
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  // Store state, code_verifier, and flow parameters in cookie (expires in 10 minutes)
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  cookieStore.set('code_verifier', codeVerifier, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  
  cookieStore.set('flow_client_id', clientId, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  
  // Store redirect_uri to ensure it matches during token exchange
  cookieStore.set('flow_redirect_uri', redirectUri, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })
  
  // Store return URL for after login
  cookieStore.set('login_return_url', returnUrl, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  // Construct authorization URL
  const hydraPublicUrl = config.hydraPublicUrl
  const authUrl = `${hydraPublicUrl}/oauth2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `prompt=login&` + // Force login prompt
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`

  redirect(authUrl)
}
