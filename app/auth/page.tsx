'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/app/components/page-header'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Tabs } from '@/components/application/tabs/tabs'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { config } from '@/lib/config'

interface Client {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  grant_types?: string[]
  scope?: string
  redirect_uris?: string[]
}

export default function AuthPage() {
  const router = useRouter()
  const [clientType, setClientType] = useState<'global' | 'identity'>('global')
  const [identityId, setIdentityId] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState('')
  const [scope, setScope] = useState('openid offline')
  const [redirectUri, setRedirectUri] = useState(
    typeof window !== 'undefined' 
      ? `${window.location.origin}/callback`
      : 'http://localhost:3000/callback'
  )

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

  // Fetch identity clients
  const { data: identityClients = [], isLoading: loadingIdentity } = useQuery({
    queryKey: ['identity-clients', identityId],
    queryFn: async () => {
      if (!identityId.trim()) {
        return []
      }
      const response = await fetch(`/api/identity-clients?identity_id=${encodeURIComponent(identityId)}`)
      if (!response.ok) {
        throw new Error('Failed to load identity clients')
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    },
    enabled: clientType === 'identity' && !!identityId.trim(),
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

  // Auto-fill redirect URI and scope from selected client
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clients.find((c: Client) => (c.client_id || c.id) === clientId)
    if (client) {
      if (client.redirect_uris && client.redirect_uris.length > 0) {
        setRedirectUri(client.redirect_uris[0])
      }
      if (client.scope) {
        setScope(client.scope)
      }
    }
  }

  const handleStartFlow = () => {
    if (!selectedClientId) {
      return
    }

    // Store flow parameters in sessionStorage for callback page
    sessionStorage.setItem('auth_flow_params', JSON.stringify({
      clientId: selectedClientId,
      clientSecret,
      scope,
      redirectUri,
      clientType,
      identityId: clientType === 'identity' ? identityId : undefined,
    }))

    // Redirect to init API which will handle the OAuth flow
    const params = new URLSearchParams({
      client_id: selectedClientId,
      ...(clientSecret && { client_secret: clientSecret }),
      scope,
      redirect_uri: redirectUri,
    })
    router.push(`/api/auth/init?${params.toString()}`)
  }

  const canStartFlow = selectedClientId && scope.trim() && redirectUri.trim()

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Authorization Code Flow"
        breadcrumbs={[
          { label: 'Flows', href: '/auth' },
          { label: 'Authorization Code' },
        ]}
        description="Configure and start the OAuth 2.0 Authorization Code flow with PKCE."
      />

      <div className="space-y-6">
        <Tabs
            selectedKey={clientType}
            onSelectionChange={(key) => {
              setClientType(key as 'global' | 'identity')
              setSelectedClientId('')
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
                        Please create a client first before starting the authorization flow.
                      </EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState>
                </div>
              ) : (
                <div className="space-y-4">
                    <Select
                      label="Client"
                      placeholder="Select a client"
                      selectedKey={selectedClientId}
                      onSelectionChange={(key) => handleClientChange(key as string)}
                      items={clientOptions}
                    >
                      {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>

                  {selectedClient && (
                    <>
                      <Input
                        label="Client Secret"
                        type="password"
                        value={clientSecret}
                        onChange={(value: string) => setClientSecret(value)}
                        placeholder="Enter client secret (optional for public clients)"
                        hint="Required for confidential clients"
                      />

                      <Input
                        label="Scope"
                        type="text"
                        value={scope}
                        onChange={(value: string) => setScope(value)}
                        placeholder="openid offline"
                        isRequired
                      />

                      <Input
                        label="Redirect URI"
                        type="text"
                        value={redirectUri}
                        onChange={(value: string) => setRedirectUri(value)}
                        placeholder="http://localhost:3000/callback"
                        isRequired
                        hint="Must match one of the client's configured redirect URIs"
                      />
                    </>
                  )}
                </div>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="identity" className="mt-6">
              <div className="space-y-4">
                <Input
                  label="Identity ID"
                  type="text"
                  value={identityId}
                  onChange={(value: string) => {
                    setIdentityId(value)
                    setSelectedClientId('')
                  }}
                  placeholder="Enter identity UUID"
                  isRequired
                  hint="Enter the identity UUID to load associated clients"
                />

                {loadingIdentity ? (
                  <div className="py-8">
                    <LoadingIndicator size="md" label="Loading identity clients..." />
                  </div>
                ) : identityId.trim() && identityClients.length === 0 ? (
                  <div className="py-8">
                    <EmptyState>
                      <EmptyState.Header>
                        <EmptyState.Illustration type="box" />
                      </EmptyState.Header>
                      <EmptyState.Content>
                        <EmptyState.Title>No clients found</EmptyState.Title>
                        <EmptyState.Description>
                          No clients found for this identity. Please create a client first.
                        </EmptyState.Description>
                      </EmptyState.Content>
                    </EmptyState>
                  </div>
                ) : identityId.trim() ? (
                  <div className="space-y-4">
                    <Select
                      label="Client"
                      placeholder="Select a client"
                      selectedKey={selectedClientId}
                      onSelectionChange={(key) => handleClientChange(key as string)}
                      items={clientOptions}
                    >
                      {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>

                    {selectedClient && (
                      <>
                        <Input
                          label="Client Secret"
                          type="password"
                          value={clientSecret}
                          onChange={(value: string) => setClientSecret(value)}
                          placeholder="Enter client secret (optional for public clients)"
                          hint="Required for confidential clients"
                        />

                        <Input
                          label="Scope"
                          type="text"
                          value={scope}
                          onChange={(value: string) => setScope(value)}
                          placeholder="openid offline"
                          isRequired
                        />

                        <Input
                          label="Redirect URI"
                          type="text"
                          value={redirectUri}
                          onChange={(value: string) => setRedirectUri(value)}
                          placeholder="http://localhost:3000/callback"
                          isRequired
                          hint="Must match one of the client's configured redirect URIs"
                        />
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </Tabs.Panel>
          </Tabs>

        {canStartFlow && (
          <div className="mt-6 flex justify-end">
            <Button color="primary" size="md" onClick={handleStartFlow}>
              Start Authorization Flow
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
