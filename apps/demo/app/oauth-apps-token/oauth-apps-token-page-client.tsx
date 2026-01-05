'use client'

import { useState, useEffect } from 'react'
import { HydrationBoundary, useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Tabs } from '@/components/application/tabs/tabs'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { Card, CardContent } from '@/app/components/ui/card'
import { CodeSnippet } from '@/app/components/ui/code-snippet'
import { useAuth } from '@/hooks/use-auth'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { toast } from 'sonner'
import type { DehydratedState } from '@tanstack/react-query'

interface Client {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  client_secret?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface ApiTestResult {
  status?: number
  statusText?: string
  success?: boolean
  data?: any
  error?: string
}

interface OAuthAppsTokenPageClientProps {
  dehydratedState: DehydratedState
  identityId: string | null
}

export function OAuthAppsTokenPageClient({ dehydratedState, identityId: serverIdentityId }: OAuthAppsTokenPageClientProps) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <OAuthAppsTokenContent serverIdentityId={serverIdentityId} />
    </HydrationBoundary>
  )
}

function OAuthAppsTokenContent({ serverIdentityId }: { serverIdentityId: string | null }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const [clientType, setClientType] = useState<'global' | 'identity'>('identity')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null)
  const [apiResult, setApiResult] = useState<ApiTestResult | null>(null)
  const [isTestingApi, setIsTestingApi] = useState(false)

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Flows', href: '/oauth-apps-token' },
      { label: 'OAuth Apps Token Flow' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs])

  // Use identity ID from server (prefetched) or from session (fallback)
  const identityId = serverIdentityId || user?.identityId

  // Fetch global clients - this will use the prefetched data from SSR
  const { data: globalClients = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to load global clients')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Fetch identity clients for current user - this will use the prefetched data from SSR
  const { data: identityClients = [], isLoading: loadingIdentity } = useQuery({
    queryKey: ['identity-clients', identityId],
    queryFn: async () => {
      const response = await fetch(`/api/identity-clients`)
      if (!response.ok) {
        throw new Error('Failed to load identity clients')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    enabled: clientType === 'identity' && !!identityId && isAuthenticated,
  })

  const clients = clientType === 'global' ? globalClients : identityClients
  const isLoading = clientType === 'global' ? loadingGlobal : loadingIdentity

  const clientOptions = clients.map((client: Client) => ({
    id: client.client_id || client.id || '',
    label: client.client_name || client.name || client.client_id || client.id || 'Unknown',
  }))

  const selectedClient = clients.find(
    (client: Client) => (client.client_id || client.id) === selectedClientId
  )

  // Auto-fill client secret from selected client if available
  useEffect(() => {
    if (selectedClient && selectedClient.client_secret) {
      setClientSecret(selectedClient.client_secret)
    } else {
      setClientSecret('')
    }
  }, [selectedClient])

  // Request token mutation
  const requestTokenMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClientId || !clientSecret) {
        throw new Error('Client ID and Client Secret are required')
      }

      const response = await fetch('/api/client-credentials/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          client_secret: clientSecret,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.error_description || 'Failed to get token')
      }

      return data as TokenResponse
    },
    onSuccess: (data: TokenResponse) => {
      setTokenResponse(data)
      setApiResult(null) // Clear previous API test result
      toast.success('Access Token Received', {
        description: 'Successfully obtained access token using OAuth apps token flow.',
      })
      // Automatically test API after successful token retrieval
      if (data.access_token) {
        setTimeout(() => {
          testApi(data.access_token)
        }, 500)
      }
    },
    onError: (err: Error) => {
      toast.error('Failed to Get Token', {
        description: err.message,
      })
    },
  })

  const handleRequestToken = () => {
    if (!selectedClientId) {
      toast.error('Client Required', {
        description: 'Please select a client first.',
      })
      return
    }

    if (!clientSecret.trim()) {
      toast.error('Client Secret Required', {
        description: 'Please enter the client secret.',
      })
      return
    }

    requestTokenMutation.mutate()
  }

  const canRequestToken = selectedClientId && clientSecret.trim()

  async function testApi(accessToken?: string) {
    const token = accessToken || tokenResponse?.access_token
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

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="OAuth Apps Token Flow"
        description="Machine-to-machine OAuth 2.0 flow using UMS OAuth Apps token endpoint. No user interaction required."
      />

      <div className="space-y-6">
        <Tabs
          selectedKey={clientType}
          onSelectionChange={(key) => {
            setClientType(key as 'global' | 'identity')
            setSelectedClientId('')
            setClientSecret('')
            setTokenResponse(null)
          }}
        >
          <Tabs.List 
            type="button-brand" 
            size="md" 
            fullWidth
            items={[
              { id: 'identity', label: 'My OAuth Clients' },
              { id: 'global', label: 'Global Clients' },
            ]}
          >
            {(item) => <Tabs.Item id={item.id}>{item.label}</Tabs.Item>}
          </Tabs.List>

          <Tabs.Panel id="global" className="mt-6">
            {loadingGlobal ? (
              <div className="py-8">
                <LoadingIndicator size="md" label="Loading global clients..." />
              </div>
            ) : globalClients.length === 0 ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>No global clients found</EmptyState.Title>
                    <EmptyState.Description>
                      Please create a client first before requesting a token.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleRequestToken(); }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Select
                          label="Client ID"
                          placeholder="Select a client"
                          selectedKey={selectedClientId}
                          onSelectionChange={(key) => setSelectedClientId(key as string)}
                          items={clientOptions}
                          isRequired
                        >
                          {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>

                        {selectedClientId && (
                          <Input
                            label="Client Secret"
                            type="password"
                            value={clientSecret}
                            onChange={(value: string) => setClientSecret(value)}
                            placeholder="Enter client secret"
                            isRequired
                            hint="Required for token request. 1Password and Apple Keychain supported."
                            autoComplete="current-password"
                            name="client_secret"
                            id="client_secret"
                            {...({ 'data-1p-ignore': 'false', 'data-lpignore': 'false' } as any)}
                          />
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit"
                          color="primary" 
                          size="md" 
                          isDisabled={requestTokenMutation.isPending || !canRequestToken}
                        >
                          {requestTokenMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <LoadingIndicator size="sm" />
                              Requesting Token...
                            </span>
                          ) : (
                            'Get Token'
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </Tabs.Panel>

          <Tabs.Panel id="identity" className="mt-6">
            {authLoading ? (
              <div className="py-8">
                <LoadingIndicator size="md" label="Checking authentication..." />
              </div>
            ) : !isAuthenticated || !identityId ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>Authentication Required</EmptyState.Title>
                    <EmptyState.Description>
                      Please log in to view and use your OAuth clients.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            ) : loadingIdentity ? (
              <div className="py-8">
                <LoadingIndicator size="md" label="Loading your OAuth clients..." />
              </div>
            ) : identityClients.length === 0 ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>No clients found</EmptyState.Title>
                    <EmptyState.Description>
                      No OAuth clients found. Please create a client first.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={(e) => { e.preventDefault(); handleRequestToken(); }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <Select
                          label="Client ID"
                          placeholder="Select a client"
                          selectedKey={selectedClientId}
                          onSelectionChange={(key) => setSelectedClientId(key as string)}
                          items={clientOptions}
                          isRequired
                        >
                          {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>

                        {selectedClientId && (
                          <Input
                            label="Client Secret"
                            type="password"
                            value={clientSecret}
                            onChange={(value: string) => setClientSecret(value)}
                            placeholder="Enter client secret"
                            isRequired
                            hint="Required for token request. 1Password and Apple Keychain supported."
                            autoComplete="current-password"
                            name="client_secret"
                            id="client_secret"
                            {...({ 'data-1p-ignore': 'false', 'data-lpignore': 'false' } as any)}
                          />
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit"
                          color="primary" 
                          size="md" 
                          isDisabled={requestTokenMutation.isPending || !canRequestToken}
                        >
                          {requestTokenMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <LoadingIndicator size="sm" />
                              Requesting Token...
                            </span>
                          ) : (
                            'Get Token'
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </Tabs.Panel>
        </Tabs>

        {tokenResponse && (
          <>
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Token Response</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">
                      Access Token
                    </label>
                    <CodeSnippet code={tokenResponse.access_token} language="text" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-secondary mb-1 block">
                        Token Type
                      </label>
                      <p className="text-primary">{tokenResponse.token_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary mb-1 block">
                        Expires In
                      </label>
                      <p className="text-primary">{tokenResponse.expires_in} seconds</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">
                      Full Response
                    </label>
                    <CodeSnippet 
                      code={JSON.stringify(tokenResponse, null, 2)} 
                      language="json" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Test Section */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">API Test</h2>
                  <Button
                    color="primary"
                    size="md"
                    onClick={() => testApi()}
                    isDisabled={!tokenResponse?.access_token || isTestingApi}
                  >
                    {isTestingApi ? (
                      <span className="flex items-center gap-2">
                        <LoadingIndicator size="sm" />
                        Testing...
                      </span>
                    ) : (
                      'Test API'
                    )}
                  </Button>
                </div>

                {apiResult && (
                  <div className="space-y-4">
                    <div className={`rounded-lg border p-4 ${
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

                    <div>
                      <label className="text-sm font-medium text-secondary mb-1 block">
                        API Response
                      </label>
                      <CodeSnippet
                        code={JSON.stringify(
                          apiResult.success ? apiResult.data : { error: apiResult.error, status: apiResult.status },
                          null,
                          2
                        )}
                        language="json"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  )
}

