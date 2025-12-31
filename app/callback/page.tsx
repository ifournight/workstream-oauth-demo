import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { config } from '@/lib/config'
import Link from 'next/link'
import { PageHeader } from '@/app/components/page-header'

interface SearchParams {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { code, state, error, error_description } = searchParams

  if (error) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Authorization Error"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description={`Authorization failed: ${error}. ${error_description || 'Please try again.'}`}
        />
        <p className="mb-2"><strong>Error:</strong> {error}</p>
        <p className="mb-4"><strong>Description:</strong> {error_description || 'No description'}</p>
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="No Authorization Code"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description="No authorization code was received in the callback. Please restart the authorization flow."
        />
        <p className="mb-4">No authorization code was received in the callback.</p>
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('code_verifier')?.value

  if (!state || state !== storedState) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="State Mismatch"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description="State parameter does not match. This may indicate a CSRF attack or expired session. Please restart the authorization flow."
        />
        <p className="mb-4">State parameter does not match. Possible CSRF attack or expired session.</p>
        <p className="mb-2"><strong>Received state:</strong> {state || 'null'}</p>
        <p className="mb-4"><strong>Stored state:</strong> {storedState || 'null (not found)'}</p>
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }

  if (!codeVerifier) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="PKCE Error"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description="Code verifier is missing. Please restart the authorization flow to generate a new code verifier."
        />
        <p className="mb-4">Code verifier is missing. Please restart the authorization flow.</p>
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }

  // Exchange authorization code for tokens
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/callback`
  const audience = 'http://localhost:3392'

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
    audience,
  })

  try {
    const tokenResponse = await fetch(`${config.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return (
        <div className="max-w-2xl">
          <PageHeader
            title="Token Exchange Failed"
            breadcrumbs={[
              { label: 'Flows', href: '/auth' },
              { label: 'Authorization Code' },
              { label: 'Callback' },
            ]}
            description="Failed to exchange authorization code for access token. Please check the error details below."
          />
          <pre className="bg-secondary p-4 rounded overflow-auto">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
          <Link href="/" className="text-brand-primary hover:underline mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      )
    }

    // Note: Cookies will expire automatically after 10 minutes (maxAge: 600)
    // Cookie deletion is not allowed in page components in Next.js 15

    // Test API call with the access token
    let apiResult: any = null
    let apiError: string | null = null

    try {
      const apiResponse = await fetch(config.testApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
          'x-core-company-id': config.companyId,
        },
      })

      apiResult = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        success: apiResponse.ok && apiResponse.status !== 401,
      }

      if (apiResponse.ok) {
        apiResult.data = await apiResponse.json()
      } else {
        apiResult.error = await apiResponse.text()
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : 'Unknown error'
    }

    return (
      <div className="max-w-4xl">
        <PageHeader
          title="Authorization Successful"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description="Authorization code flow completed successfully. Access token and refresh token have been received."
        />

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Received Tokens:</h2>
          <pre className="bg-secondary p-4 rounded overflow-auto text-sm">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">API Test Result:</h2>
          <div className={`p-4 rounded ${apiResult?.success ? 'bg-success-secondary border border-success' : 'bg-error-secondary border border-error'}`}>
            {apiError ? (
              <>
                <h3 className="font-semibold text-error-primary mb-2">❌ API Test Failed</h3>
                <p><strong>Error:</strong> {apiError}</p>
              </>
            ) : apiResult?.success ? (
              <>
                <h3 className="font-semibold text-success-primary mb-2">✓ API Test Successful</h3>
                <p className="mb-2"><strong>Status:</strong> {apiResult.status} {apiResult.statusText}</p>
                {apiResult.data && (
                  <pre className="bg-primary p-2 rounded text-xs overflow-auto mt-2">
                    {JSON.stringify(apiResult.data, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <>
                <h3 className="font-semibold text-error-primary mb-2">❌ API Test Failed</h3>
                <p className="mb-2"><strong>Status:</strong> {apiResult?.status} {apiResult?.statusText}</p>
                {apiResult?.error && (
                  <pre className="bg-primary p-2 rounded text-xs overflow-auto mt-2">
                    {apiResult.error}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>

        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  } catch (error) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Token Exchange Error"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description="An error occurred during token exchange. Please check the error message below."
        />
        <p className="mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <Link href="/" className="text-brand-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    )
  }
}

