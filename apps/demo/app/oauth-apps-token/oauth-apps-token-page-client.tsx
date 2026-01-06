'use client'

import { useState, useEffect } from 'react'
import { HydrationBoundary, useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('tokenFlow')
  const tCommon = useTranslations('common')
  const tClients = useTranslations('clients')
  const tAuth = useTranslations('auth')
  const tNav = useTranslations('navigation')
  const [canManageGlobalClients, setCanManageGlobalClients] = useState(false)
  
  // Check access control via API
  useEffect(() => {
    if (isAuthenticated && (user?.identityId || serverIdentityId)) {
      fetch('/api/auth/access-control')
        .then(res => res.json())
        .then(data => {
          setCanManageGlobalClients(data.canManageGlobalClients || false)
        })
        .catch(error => {
          console.error('Error checking access control:', error)
          setCanManageGlobalClients(false)
        })
    } else {
      setCanManageGlobalClients(false)
    }
  }, [isAuthenticated, user?.identityId, serverIdentityId])
  
  // Default to 'identity' if user doesn't have access to global clients
  const [clientType, setClientType] = useState<'global' | 'identity'>('identity')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null)
  const [apiResult, setApiResult] = useState<ApiTestResult | null>(null)
  const [isTestingApi, setIsTestingApi] = useState(false)
  
  // Reset to 'identity' if user loses access to global clients
  useEffect(() => {
    if (!canManageGlobalClients && clientType === 'global') {
      setClientType('identity')
      setSelectedClientId('')
      setClientSecret('')
      setTokenResponse(null)
    }
  }, [canManageGlobalClients, clientType])

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: tNav('flows'), href: '/oauth-apps-token' },
      { label: tNav('oauthAppsTokenFlow') },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs, tNav])

  // Use identity ID from server (prefetched) or from session (fallback)
  const identityId = serverIdentityId || user?.identityId

  // Fetch global clients - this will use the prefetched data from SSR
  // Only fetch if user has access
  const { data: globalClients = [], isLoading: loadingGlobal } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error(tClients('failedToLoadClients'))
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    enabled: canManageGlobalClients,
  })

  // Fetch identity clients for current user - this will use the prefetched data from SSR
  const { data: identityClients = [], isLoading: loadingIdentity } = useQuery({
    queryKey: ['identity-clients', identityId],
    queryFn: async () => {
      const response = await fetch(`/api/identity-clients`)
      if (!response.ok) {
        throw new Error(tClients('failedToLoadClients'))
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
    label: client.client_name || client.name || client.client_id || client.id || tCommon('n/a'),
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
        throw new Error(t('clientRequired') + ' ' + t('clientSecretRequired'))
      }

      const response = await fetch('/api/oauth-apps/token', {
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
      toast.success(t('accessTokenReceived'), {
        description: t('accessTokenReceivedDescription'),
      })
      // Automatically test API after successful token retrieval
      if (data.access_token) {
        setTimeout(() => {
          testApi(data.access_token)
        }, 500)
      }
    },
    onError: (err: Error) => {
      toast.error(t('failedToGetToken'), {
        description: err.message,
      })
    },
  })

  const handleRequestToken = () => {
    if (!selectedClientId) {
      toast.error(t('clientRequired'), {
        description: t('pleaseSelectClient'),
      })
      return
    }

    if (!clientSecret.trim()) {
      toast.error(t('clientSecretRequired'), {
        description: t('pleaseEnterClientSecret'),
      })
      return
    }

    requestTokenMutation.mutate()
  }

  const canRequestToken = selectedClientId && clientSecret.trim()

  async function testApi(accessToken?: string) {
    const token = accessToken || tokenResponse?.access_token
    if (!token) {
      toast.error(t('noAccessToken'), {
        description: t('cannotTestApiWithoutToken'),
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
        toast.success(t('apiTestSuccessful'), {
          description: `Status: ${result.status} ${result.statusText || ''}`,
        })
      } else {
        toast.error(t('apiTestFailed'), {
          description: result.error || `Status: ${result.status} ${result.statusText || ''}`,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : tCommon('n/a')
      setApiResult({
        success: false,
        error: errorMessage,
      })
      toast.error(t('apiTestError'), {
        description: errorMessage,
      })
    } finally {
      setIsTestingApi(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={t('title')}
        description={t('description')}
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
              { id: 'identity', label: tClients('myOAuthClients') },
              ...(canManageGlobalClients ? [{ id: 'global', label: tClients('globalClients') }] : []),
            ]}
          >
            {(item) => <Tabs.Item id={item.id}>{item.label}</Tabs.Item>}
          </Tabs.List>

          {canManageGlobalClients && (
            <Tabs.Panel id="global" className="mt-6">
            {loadingGlobal ? (
              <div className="py-8">
                <LoadingIndicator size="md" label={t('loadingGlobalClients')} />
              </div>
            ) : globalClients.length === 0 ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>{t('noGlobalClientsFound')}</EmptyState.Title>
                    <EmptyState.Description>
                      {t('createClientFirst')}
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
                          label={tCommon('clientId')}
                          placeholder={t('selectClient')}
                          selectedKey={selectedClientId}
                          onSelectionChange={(key) => setSelectedClientId(key as string)}
                          items={clientOptions}
                          isRequired
                        >
                          {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>

                        {selectedClientId && (
                          <Input
                            label={t('clientSecret')}
                            type="password"
                            value={clientSecret}
                            onChange={(value: string) => setClientSecret(value)}
                            placeholder={t('clientSecretPlaceholder')}
                            isRequired
                            hint={t('clientSecretHint')}
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
                              {t('requestingToken')}
                            </span>
                          ) : (
                            t('getToken')
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            </Tabs.Panel>
          )}

          <Tabs.Panel id="identity" className="mt-6">
            {authLoading ? (
              <div className="py-8">
                <LoadingIndicator size="md" label={tClients('checkingAuthentication')} />
              </div>
            ) : !isAuthenticated || !identityId ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>{tAuth('authenticationRequired')}</EmptyState.Title>
                    <EmptyState.Description>
                      {t('pleaseLogInToUseClients')}
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            ) : loadingIdentity ? (
              <div className="py-8">
                <LoadingIndicator size="md" label={t('loadingYourOAuthClients')} />
              </div>
            ) : identityClients.length === 0 ? (
              <div className="py-8">
                <EmptyState>
                  <EmptyState.Header>
                    <EmptyState.Illustration type="box" />
                  </EmptyState.Header>
                  <EmptyState.Content>
                    <EmptyState.Title>{tClients('noClientsFound')}</EmptyState.Title>
                    <EmptyState.Description>
                      {t('noClientsFoundCreateFirst')}
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
                          label={tCommon('clientId')}
                          placeholder={t('selectClient')}
                          selectedKey={selectedClientId}
                          onSelectionChange={(key) => setSelectedClientId(key as string)}
                          items={clientOptions}
                          isRequired
                        >
                          {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                        </Select>

                        {selectedClientId && (
                          <Input
                            label={t('clientSecret')}
                            type="password"
                            value={clientSecret}
                            onChange={(value: string) => setClientSecret(value)}
                            placeholder={t('clientSecretPlaceholder')}
                            isRequired
                            hint={t('clientSecretHint')}
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
                              {t('requestingToken')}
                            </span>
                          ) : (
                            t('getToken')
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
                <h2 className="text-xl font-semibold mb-4">{t('tokenResponse')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">
                      {t('accessToken')}
                    </label>
                    <CodeSnippet code={tokenResponse.access_token} language="text" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-secondary mb-1 block">
                        {t('tokenType')}
                      </label>
                      <p className="text-primary">{tokenResponse.token_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary mb-1 block">
                        {t('expiresIn')}
                      </label>
                      <p className="text-primary">{tokenResponse.expires_in} {t('seconds')}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">
                      {t('fullResponse')}
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
                  <h2 className="text-xl font-semibold">{t('apiTest')}</h2>
                  <Button
                    color="primary"
                    size="md"
                    onClick={() => testApi()}
                    isDisabled={!tokenResponse?.access_token || isTestingApi}
                  >
                    {isTestingApi ? (
                      <span className="flex items-center gap-2">
                        <LoadingIndicator size="sm" />
                        {t('testing')}
                      </span>
                    ) : (
                      t('testApi')
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
                        {apiResult.success ? t('apiTestSuccessful') : t('apiTestFailed')}
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
                        {t('apiResponse')}
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

