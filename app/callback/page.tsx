'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header'
import { CodeSnippet } from '@/app/components/ui/code-snippet'
import { Input } from '@/components/base/input/input'
import { Button } from '@/components/base/buttons/button'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { Alert } from '@/components/ui/alert'
import { toast } from 'sonner'
import { config } from '@/lib/config'
import { Copy, Check } from '@untitledui/icons'
import { useClipboard } from '@/hooks/use-clipboard'

interface TokenData {
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
  id_token?: string
}

interface ApiTestResult {
  status?: number
  statusText?: string
  success?: boolean
  data?: any
  error?: string
}

export default function CallbackPage() {
  const searchParams = useSearchParams()
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [apiResult, setApiResult] = useState<ApiTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingApi, setIsTestingApi] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { copied: copiedAccessToken, copy: copyAccessToken } = useClipboard()
  const { copied: copiedIdToken, copy: copyIdToken } = useClipboard()

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  useEffect(() => {
    if (errorParam) {
      setError(`${errorParam}: ${errorDescription || 'Unknown error'}`)
      setIsLoading(false)
      return
    }

    if (!code) {
      setError('No authorization code was received in the callback.')
      setIsLoading(false)
      return
    }

    // Exchange authorization code for tokens
    exchangeCodeForTokens(code, state)
  }, [code, state, errorParam, errorDescription])

  async function exchangeCodeForTokens(authCode: string, authState: string | null) {
    try {
      // Get stored flow parameters from sessionStorage
      const flowParamsStr = typeof window !== 'undefined' ? sessionStorage.getItem('auth_flow_params') : null
      let clientId: string | undefined
      let clientSecret: string | undefined

      if (flowParamsStr) {
        try {
          const flowParams = JSON.parse(flowParamsStr)
          clientId = flowParams.clientId
          clientSecret = flowParams.clientSecret
        } catch (e) {
          console.warn('Failed to parse flow params from sessionStorage', e)
        }
      }

      // Use API route to exchange token (handles cookies server-side)
      // redirect_uri will be retrieved from cookie in the API route to ensure it matches
      const tokenResponse = await fetch('/api/auth/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: authCode,
          // Don't send redirect_uri - let the API route use the stored one from cookie
          // This ensures it matches exactly what was used in the authorization request
          ...(clientId && { client_id: clientId }),
          ...(clientSecret && { client_secret: clientSecret }),
        }),
      })

      const data = await tokenResponse.json()

      if (!tokenResponse.ok) {
        setError(`Token exchange failed: ${data.error || data.error_description || 'Unknown error'}`)
        setIsLoading(false)
        toast.error('Token Exchange Failed', {
          description: data.error_description || data.error || 'Failed to exchange authorization code for tokens',
        })
        return
      }

      setTokenData(data)
      setIsLoading(false)

      // Automatically test API after successful token exchange
      if (data.access_token) {
        setTimeout(() => {
          testApi(data.access_token!)
        }, 500)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(`Token exchange error: ${errorMessage}`)
      setIsLoading(false)
      toast.error('Token Exchange Error', {
        description: errorMessage,
      })
    }
  }


  async function testApi(accessToken?: string) {
    const token = accessToken || tokenData?.access_token
    if (!token) {
      toast.error('No Access Token', {
        description: 'Cannot test API without an access token',
      })
      return
    }

    setIsTestingApi(true)
    try {
      const response = await fetch('/api/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: token }),
      })

      const result: ApiTestResult = await response.json()

      setApiResult(result)

      if (result.success) {
        toast.success('API Test Successful', {
          description: `Status: ${result.status} ${result.statusText || ''}`,
        })
      } else {
        toast.error('API Test Failed', {
          description: result.error || `Status: ${result.status} ${result.statusText || ''}`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setApiResult({
        success: false,
        error: errorMessage,
      })
      toast.error('API Test Error', {
        description: errorMessage,
      })
    } finally {
      setIsTestingApi(false)
    }
  }

  function generateCurlCommand() {
    if (!tokenData?.access_token) return ''

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `curl -X GET '${config.testApiUrl}' \\
  -H 'Authorization: Bearer ${tokenData.access_token}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-core-company-id: ${config.companyId}'`
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl">
      <PageHeader
        title="Processing Authorization"
        breadcrumbs={[
          { label: 'Flows', href: '/auth' },
          { label: 'Authorization Code' },
          { label: 'Callback' },
        ]}
        description="Exchanging authorization code for access token..."
      />
      <div className="py-12">
        <LoadingIndicator size="md" label="Processing authorization..." />
      </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl">
        <PageHeader
          title="Authorization Error"
          breadcrumbs={[
            { label: 'Flows', href: '/auth' },
            { label: 'Authorization Code' },
            { label: 'Callback' },
          ]}
          description={error}
        />
        <div className="rounded-lg bg-error-secondary border border-error p-4">
          <p className="text-error-primary font-semibold mb-2">Error</p>
          <p className="text-secondary">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <PageHeader
        title="Authorization Successful"
        breadcrumbs={[
          { label: 'Flows', href: '/auth' },
          { label: 'Authorization Code' },
          { label: 'Callback' },
        ]}
        description="Authorization code flow completed successfully. Access token and refresh token have been received."
      />

      {/* Token Response Form */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Token Response</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-secondary">Access Token</label>
                <Button
                  color="tertiary"
                  size="sm"
                  onClick={() => tokenData?.access_token && copyAccessToken(tokenData.access_token)}
                  iconLeading={copiedAccessToken ? Check : Copy}
                >
                  {copiedAccessToken ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <Input
                value={tokenData?.access_token || ''}
                onChange={() => {}}
                isDisabled
                inputClassName="font-mono text-sm"
              />
            </div>
            {tokenData?.refresh_token && (
              <Input
                label="Refresh Token"
                value={tokenData.refresh_token}
                onChange={() => {}}
                isDisabled
                inputClassName="font-mono text-sm"
              />
            )}
            {tokenData?.token_type && (
              <Input
                label="Token Type"
                value={tokenData.token_type}
                onChange={() => {}}
                isDisabled
              />
            )}
            {tokenData?.expires_in !== undefined && (
              <Input
                label="Expires In (seconds)"
                value={tokenData.expires_in.toString()}
                onChange={() => {}}
                isDisabled
              />
            )}
            {tokenData?.scope && (
              <Input
                label="Scope"
                value={tokenData.scope}
                onChange={() => {}}
                isDisabled
              />
            )}
            {tokenData?.id_token && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-secondary">ID Token</label>
                  <Button
                    color="tertiary"
                    size="sm"
                    onClick={() => tokenData?.id_token && copyIdToken(tokenData.id_token)}
                    iconLeading={copiedIdToken ? Check : Copy}
                  >
                    {copiedIdToken ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <Input
                  value={tokenData.id_token}
                  onChange={() => {}}
                  isDisabled
                  inputClassName="font-mono text-sm"
                />
              </div>
            )}
          </div>

          <div className="mt-6">
            <CodeSnippet
              code={JSON.stringify(tokenData, null, 2)}
              language="json"
              title="Full Response JSON"
            />
          </div>
        </div>

        {/* API Test Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">API Test</h2>
            <Button
              color="primary"
              size="md"
              onClick={() => testApi()}
              isDisabled={!tokenData?.access_token || isTestingApi}
              isLoading={isTestingApi}
            >
              {isTestingApi ? 'Testing...' : 'Test API'}
            </Button>
          </div>

          <div className="mb-6">
            <Alert variant="info" className="mb-4">
              <p className="text-sm">
                <strong>Note:</strong> The API test uses hardcoded values for <code className="bg-secondary px-1 py-0.5 rounded text-xs">core company id</code> and endpoint query parameters. 
                These will be configurable via API selection in a future update.
              </p>
            </Alert>
          </div>

          {tokenData?.access_token && (
            <div className="mb-6">
              <CodeSnippet
                code={generateCurlCommand()}
                language="bash"
                title="cURL Command"
              />
            </div>
          )}

          {apiResult && (
            <div>
              <div className={`mb-4 rounded-lg border p-4 ${
                apiResult.success
                  ? 'bg-success-secondary border-success'
                  : 'bg-error-secondary border-error'
              }`}>
                <p className={`font-semibold mb-2 ${
                  apiResult.success ? 'text-success-primary' : 'text-error-primary'
                }`}>
                  {apiResult.success ? '✓ API Test Successful' : '❌ API Test Failed'}
                </p>
                {apiResult.status && (
                  <p className="text-sm text-secondary mb-2">
                    Status: {apiResult.status} {apiResult.statusText || ''}
                  </p>
                )}
                {apiResult.error && (
                  <p className="text-sm text-error-primary">{apiResult.error}</p>
                )}
              </div>

              <CodeSnippet
                code={JSON.stringify(
                  apiResult.success ? apiResult.data : { error: apiResult.error, status: apiResult.status },
                  null,
                  2
                )}
                language="json"
                title="API Response"
                collapsible
                defaultOpen={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
