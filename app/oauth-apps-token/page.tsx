'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
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

export default function OAuthAppsTokenPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const [clientType, setClientType] = useState<'global' | 'identity'>('global')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState('')
  const [tokenResponse, setTokenResponse] = useState<TokenResponse | null>(null)

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Flows', href: '/oauth-apps-token' },
      { label: 'OAuth Apps Token Flow' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs])

  // Use identity ID from session for identity clients
  const identityId = user?.identityId

  // Fetch global clients
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

  // Fetch identity clients for current user
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
      toast.success('Access Token Received', {
        description: 'Successfully obtained access token using OAuth apps token flow.',
      })
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
              { id: 'global', label: 'Global Clients' },
              { id: 'identity', label: 'Identity Clients' },
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

                        <Input
                          label="Client Secret"
                          type="text"
                          value={clientSecret}
                          onChange={(value: string) => setClientSecret(value)}
                          placeholder="Enter client secret"
                          isRequired
                          hint="Required for token request. 1Password supported."
                          autoComplete="off"
                          {...({ 'data-1p-ignore': 'false' } as any)}
                        />
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
                      Please log in to view and use your identity-specific clients.
                    </EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState>
              </div>
            ) : loadingIdentity ? (
              <div className="py-8">
                <LoadingIndicator size="md" label="Loading identity clients..." />
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
                      No clients found for your identity. Please create a client first.
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

                        <Input
                          label="Client Secret"
                          type="text"
                          value={clientSecret}
                          onChange={(value: string) => setClientSecret(value)}
                          placeholder="Enter client secret"
                          isRequired
                          hint="Required for token request. 1Password supported."
                          autoComplete="off"
                          {...({ 'data-1p-ignore': 'false' } as any)}
                        />
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
        )}

      </div>
    </div>
  )
}

