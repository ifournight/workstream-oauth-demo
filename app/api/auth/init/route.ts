import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { config } from '@/lib/config'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/oauth'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id') || config.clientId
  const clientSecret = searchParams.get('client_secret') || ''
  const scope = searchParams.get('scope') || 'openid offline'
  // Use /api/auth/callback as the default redirect URI for auth flow
  const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`
  // Get return URL (where to redirect after successful auth)
  const returnUrl = searchParams.get('return_url') || '/auth'

  if (!clientId) {
    redirect('/auth?error=missing_client_id')
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
  
  // Store client credentials for token exchange
  if (clientSecret) {
    cookieStore.set('client_secret', clientSecret, {
      httpOnly: true,
      maxAge: 600,
      path: '/',
      sameSite: 'lax',
    })
  }
  
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
  
  // Store return URL for after auth (used by /api/auth/callback)
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
    `prompt=consent&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`

  redirect(authUrl)
}
