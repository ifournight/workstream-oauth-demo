import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { config } from '@/lib/config'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/oauth'

export default async function AuthPage() {
  if (!config.clientId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
        <p>CLIENT_ID not configured. Please set it as an environment variable.</p>
      </div>
    )
  }

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  // Store state and code_verifier in cookie (expires in 10 minutes)
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

  // Construct redirect URI
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/callback`
  const scope = 'openid offline'

  const authUrl = `${config.hydraPublicUrl}/oauth2/auth?` +
    `client_id=${encodeURIComponent(config.clientId)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `prompt=consent&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`

  redirect(authUrl)
}

