import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { config } from '@/lib/config'
import { createSession } from '@/lib/session'
import { getIdentityIdFromToken } from '@/lib/jwt'

/**
 * GET /api/auth/callback
 * Handle OAuth callback from Hydra
 * Exchange authorization code for tokens and create session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      redirect(`/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`)
    }

    if (!code) {
      redirect('/login?error=missing_code')
    }

    // Verify state (optional but recommended)
    const cookieStore = await cookies()
    const storedState = cookieStore.get('oauth_state')?.value
    if (state && storedState && state !== storedState) {
      redirect('/login?error=invalid_state')
    }

    // Get stored flow parameters
    const codeVerifier = cookieStore.get('code_verifier')?.value
    const storedClientId = cookieStore.get('flow_client_id')?.value
    const storedRedirectUri = cookieStore.get('flow_redirect_uri')?.value
    const returnUrl = cookieStore.get('login_return_url')?.value || '/'

    const finalClientId = storedClientId || config.clientId
    const finalRedirectUri = storedRedirectUri || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback`

    if (!finalClientId) {
      redirect('/login?error=missing_client_id')
    }

    if (!finalRedirectUri) {
      redirect('/login?error=missing_redirect_uri')
    }

    // Exchange authorization code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: finalRedirectUri,
      client_id: finalClientId,
      ...(config.clientSecret && { client_secret: config.clientSecret }),
      ...(codeVerifier && { code_verifier: codeVerifier }),
    })

    const tokenResponse = await fetch(`${config.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      redirect(`/login?error=${encodeURIComponent(tokenData.error || 'token_exchange_failed')}&error_description=${encodeURIComponent(tokenData.error_description || '')}`)
    }

    // Extract access token and refresh token
    const { access_token, refresh_token, expires_in } = tokenData

    if (!access_token) {
      redirect('/login?error=missing_access_token')
    }

    // Create session with access token
    await createSession(
      cookieStore,
      access_token,
      refresh_token,
      expires_in
    )

    // Clean up OAuth flow cookies
    cookieStore.delete('oauth_state')
    cookieStore.delete('code_verifier')
    cookieStore.delete('flow_client_id')
    cookieStore.delete('flow_redirect_uri')
    cookieStore.delete('login_return_url')

    // Redirect to return URL or home page
    redirect(returnUrl)
  } catch (error) {
    console.error('Callback error:', error)
    redirect(`/login?error=callback_error&error_description=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
  }
}
