'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Building05 } from '@untitledui/icons'
import { Heading as AriaHeading } from 'react-aria-components'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { InputBase, TextField } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { TextArea } from '@/components/base/textarea/textarea'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Select } from '@/components/base/select/select'
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { toast } from 'sonner'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { 
  useGetOAuth2Client,
  useSetOAuth2Client,
  getListOAuth2ClientsQueryKey,
  getGetOAuth2ClientQueryKey
} from '@/generated/hydra-api-browser'
import type { OAuth2Client } from '@/generated/hydra-api-browser/models'

interface ClientFormData {
  client_name: string
  scope: string
  redirect_uris: string
  grant_types: string[]
  response_types: string[]
  token_endpoint_auth_method: string
  audience: string
  allowed_cors_origins: string
  contacts: string
  jwks_uri: string
  logo_uri: string
  policy_uri: string
  tos_uri: string
  client_uri: string
  subject_type: string
  sector_identifier_uri: string
  request_uris: string
  request_object_signing_alg: string
  userinfo_signed_response_alg: string
  backchannel_logout_uri: string
  backchannel_logout_session_required: boolean
  post_logout_redirect_uris: string
  frontchannel_logout_uri: string
  frontchannel_logout_session_required: boolean
  metadata: string
}

const GRANT_TYPES = [
  { id: 'authorization_code', label: 'Authorization Code' },
  { id: 'client_credentials', label: 'Client Credentials' },
  { id: 'refresh_token', label: 'Refresh Token' },
  { id: 'urn:ietf:params:oauth:grant-type:device_code', label: 'Device Code' },
  { id: 'implicit', label: 'Implicit' },
  { id: 'password', label: 'Password' },
]

const RESPONSE_TYPES = [
  { id: 'code', label: 'Code' },
  { id: 'token', label: 'Token' },
  { id: 'id_token', label: 'ID Token' },
  { id: 'code token', label: 'Code Token' },
  { id: 'code id_token', label: 'Code ID Token' },
  { id: 'token id_token', label: 'Token ID Token' },
  { id: 'code token id_token', label: 'Code Token ID Token' },
]

const TOKEN_ENDPOINT_AUTH_METHODS = [
  { id: 'client_secret_post', label: 'Client Secret Post' },
  { id: 'client_secret_basic', label: 'Client Secret Basic' },
  { id: 'private_key_jwt', label: 'Private Key JWT' },
  { id: 'none', label: 'None' },
]

const SUBJECT_TYPES = [
  { id: 'public', label: 'Public' },
  { id: 'pairwise', label: 'Pairwise' },
]

const SIGNING_ALGORITHMS = [
  { id: 'none', label: 'None' },
  { id: 'RS256', label: 'RS256' },
  { id: 'RS384', label: 'RS384' },
  { id: 'RS512', label: 'RS512' },
  { id: 'ES256', label: 'ES256' },
  { id: 'ES384', label: 'ES384' },
  { id: 'ES512', label: 'ES512' },
  { id: 'PS256', label: 'PS256' },
  { id: 'PS384', label: 'PS384' },
  { id: 'PS512', label: 'PS512' },
  { id: 'HS256', label: 'HS256' },
  { id: 'HS384', label: 'HS384' },
  { id: 'HS512', label: 'HS512' },
]

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const { setBreadcrumbs } = useBreadcrumbs()
  const clientId = params?.id as string

  const [formData, setFormData] = useState<ClientFormData>({
    client_name: '',
    scope: 'openid offline',
    redirect_uris: '',
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
    audience: '',
    allowed_cors_origins: '',
    contacts: '',
    jwks_uri: '',
    logo_uri: '',
    policy_uri: '',
    tos_uri: '',
    client_uri: '',
    subject_type: 'public',
    sector_identifier_uri: '',
    request_uris: '',
    request_object_signing_alg: '',
    userinfo_signed_response_alg: '',
    backchannel_logout_uri: '',
    backchannel_logout_session_required: false,
    post_logout_redirect_uris: '',
    frontchannel_logout_uri: '',
    frontchannel_logout_session_required: false,
    metadata: '',
  })

  // Fetch client data using generated React Query hook
  const { data: clientResponse, isLoading: loadingClient, error: clientError } = useGetOAuth2Client(clientId, {
    query: {
      enabled: !!clientId,
    },
  })
  
  // Extract client data from response (handle both AxiosResponse and direct OAuth2Client)
  const client: OAuth2Client | undefined = clientResponse 
    ? ('data' in clientResponse && clientResponse.data ? clientResponse.data : (clientResponse as OAuth2Client))
    : undefined

  // Handle errors using useEffect (React Query v5 removed onError from query options)
  useEffect(() => {
    if (clientError) {
      const errorMessage = (clientError as any)?.message || 'Failed to load client'
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        toast.error('CORS Error', {
          description: 'Unable to connect to Hydra Admin API. Please check CORS configuration.',
        })
      }
    }
  }, [clientError])

  // Populate form when client data is loaded
  useEffect(() => {
    if (client) {
      setFormData({
        client_name: client.client_name || client.name || '',
        scope: client.scope || 'openid offline',
        redirect_uris: Array.isArray(client.redirect_uris) ? client.redirect_uris.join('\n') : '',
        grant_types: Array.isArray(client.grant_types) ? client.grant_types : ['authorization_code'],
        response_types: Array.isArray(client.response_types) ? client.response_types : ['code'],
        token_endpoint_auth_method: client.token_endpoint_auth_method || 'client_secret_post',
        audience: Array.isArray(client.audience) ? client.audience.join(', ') : client.audience || '',
        allowed_cors_origins: Array.isArray(client.allowed_cors_origins) ? client.allowed_cors_origins.join('\n') : client.allowed_cors_origins || '',
        contacts: Array.isArray(client.contacts) ? client.contacts.join(', ') : client.contacts || '',
        jwks_uri: client.jwks_uri || '',
        logo_uri: client.logo_uri || '',
        policy_uri: client.policy_uri || '',
        tos_uri: client.tos_uri || '',
        client_uri: client.client_uri || '',
        subject_type: client.subject_type || 'public',
        sector_identifier_uri: client.sector_identifier_uri || '',
        request_uris: Array.isArray(client.request_uris) ? client.request_uris.join('\n') : client.request_uris || '',
        request_object_signing_alg: client.request_object_signing_alg || '',
        userinfo_signed_response_alg: client.userinfo_signed_response_alg || '',
        backchannel_logout_uri: client.backchannel_logout_uri || '',
        backchannel_logout_session_required: client.backchannel_logout_session_required || false,
        post_logout_redirect_uris: Array.isArray(client.post_logout_redirect_uris) ? client.post_logout_redirect_uris.join('\n') : client.post_logout_redirect_uris || '',
        frontchannel_logout_uri: client.frontchannel_logout_uri || '',
        frontchannel_logout_session_required: client.frontchannel_logout_session_required || false,
        metadata: client.metadata ? JSON.stringify(client.metadata, null, 2) : '',
      })
    }
  }, [client])

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Clients', href: '/clients' },
      { label: client?.client_name || client?.name || 'Edit Client' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs, client])

  const updateMutation = useSetOAuth2Client({
    mutation: {
      onSuccess: () => {
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: getListOAuth2ClientsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetOAuth2ClientQueryKey(clientId) })
        toast.success('Client Updated', {
          description: 'Client has been successfully updated.',
        })
        router.push('/clients')
      },
      onError: (err: any) => {
        const errorMessage = err?.message || 'Failed to update client'
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
          toast.error('CORS Error', {
            description: 'Unable to connect to Hydra Admin API. Please check CORS configuration.',
          })
        } else {
          toast.error('Failed to Update Client', {
            description: errorMessage,
          })
        }
      },
    },
  })

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!formData.client_name.trim()) {
      toast.error('Client Name Required', {
        description: 'Please enter a client name.',
      })
      return
    }

    // Build client data object, only including non-empty fields
    const clientData: any = {
      client_name: formData.client_name,
      scope: formData.scope || undefined,
      redirect_uris: formData.redirect_uris
        .split('\n')
        .map((uri) => uri.trim())
        .filter((uri) => uri.length > 0),
      grant_types: formData.grant_types,
      response_types: formData.response_types,
      token_endpoint_auth_method: formData.token_endpoint_auth_method,
    }

    // Add optional fields only if they have values
    if (formData.audience) {
      clientData.audience = formData.audience.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
    }
    if (formData.allowed_cors_origins) {
      clientData.allowed_cors_origins = formData.allowed_cors_origins
        .split('\n')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    }
    if (formData.contacts) {
      clientData.contacts = formData.contacts.split(',').map((c) => c.trim()).filter((c) => c.length > 0)
    }
    if (formData.jwks_uri) clientData.jwks_uri = formData.jwks_uri
    if (formData.logo_uri) clientData.logo_uri = formData.logo_uri
    if (formData.policy_uri) clientData.policy_uri = formData.policy_uri
    if (formData.tos_uri) clientData.tos_uri = formData.tos_uri
    if (formData.client_uri) clientData.client_uri = formData.client_uri
    if (formData.subject_type) clientData.subject_type = formData.subject_type
    if (formData.sector_identifier_uri) clientData.sector_identifier_uri = formData.sector_identifier_uri
    if (formData.request_uris) {
      clientData.request_uris = formData.request_uris
        .split('\n')
        .map((uri) => uri.trim())
        .filter((uri) => uri.length > 0)
    }
    if (formData.request_object_signing_alg) clientData.request_object_signing_alg = formData.request_object_signing_alg
    if (formData.userinfo_signed_response_alg) clientData.userinfo_signed_response_alg = formData.userinfo_signed_response_alg
    if (formData.backchannel_logout_uri) clientData.backchannel_logout_uri = formData.backchannel_logout_uri
    if (formData.backchannel_logout_session_required) clientData.backchannel_logout_session_required = formData.backchannel_logout_session_required
    if (formData.post_logout_redirect_uris) {
      clientData.post_logout_redirect_uris = formData.post_logout_redirect_uris
        .split('\n')
        .map((uri) => uri.trim())
        .filter((uri) => uri.length > 0)
    }
    if (formData.frontchannel_logout_uri) clientData.frontchannel_logout_uri = formData.frontchannel_logout_uri
    if (formData.frontchannel_logout_session_required) clientData.frontchannel_logout_session_required = formData.frontchannel_logout_session_required
    if (formData.metadata) {
      try {
        clientData.metadata = JSON.parse(formData.metadata)
      } catch {
        toast.error('Invalid JSON', {
          description: 'Metadata must be valid JSON.',
        })
        return
      }
    }

    updateMutation.mutate({ id: clientId, data: clientData as OAuth2Client })
  }

  function handleGrantTypeToggle(grantType: string) {
    setFormData((prev) => ({
      ...prev,
      grant_types: prev.grant_types.includes(grantType)
        ? prev.grant_types.filter((gt) => gt !== grantType)
        : [...prev.grant_types, grantType],
    }))
  }

  function handleResponseTypeToggle(responseType: string) {
    setFormData((prev) => ({
      ...prev,
      response_types: prev.response_types.includes(responseType)
        ? prev.response_types.filter((rt) => rt !== responseType)
        : [...prev.response_types, responseType],
    }))
  }

  if (loadingClient) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Edit Client" />
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label="Loading client..." />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-7xl">
        <PageHeader title="Edit Client" />
        <Card>
          <CardContent>
            <div className="py-12">
              <p className="text-center text-tertiary">Client not found.</p>
              <div className="mt-4 flex justify-center">
                <Button color="primary" onClick={() => router.push('/clients')}>
                  Back to Clients
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Edit Client"
        description={`Edit OAuth client: ${client.client_name || client.name || clientId}`}
      />

      <Card>
        <CardContent>
          <div className="py-8">
            <div className="flex gap-4 mb-6">
              <FeaturedIcon color="gray" size="lg" theme="modern" icon={Building05} className="max-sm:hidden" />

              <div className="z-10 flex flex-col gap-0.5">
                <AriaHeading slot="title" className="text-md font-semibold text-primary">
                  Client Configuration
                </AriaHeading>
                <p className="text-sm text-tertiary">
                  Configure all OAuth client settings according to Hydra Client API specifications.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col justify-start gap-6">
              {/* Client ID (read-only) */}
              <section className="flex items-start gap-8">
                <Label className="w-40 max-sm:hidden">Client ID</Label>
                <TextField name="client_id" className="flex-1" isDisabled value={client.client_id || client.id || clientId}>
                  <Label className="sm:hidden">Client ID</Label>
                  <InputBase size="md" />
                </TextField>
              </section>

              {/* Basic Information */}
              <section className="space-y-6">
                <h3 className="text-sm font-semibold text-primary">Basic Information</h3>
                
                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Client Name</Label>
                  <TextField name="client_name" className="flex-1" isRequired value={formData.client_name} onChange={(value) => setFormData({ ...formData, client_name: value || '' })}>
                    <Label className="sm:hidden">Client Name</Label>
                    <InputBase size="md" placeholder="e.g. My OAuth App" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Scope</Label>
                  <TextField name="scope" className="flex-1" value={formData.scope} onChange={(value) => setFormData({ ...formData, scope: value || '' })}>
                    <Label className="sm:hidden">Scope</Label>
                    <InputBase size="md" placeholder="openid offline" />
                  </TextField>
                </section>
              </section>

              {/* Grant Types */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-primary">Grant Types</h3>
                <div className="flex flex-wrap gap-4">
                  {GRANT_TYPES.map((gt) => (
                    <Checkbox
                      key={gt.id}
                      isSelected={formData.grant_types.includes(gt.id)}
                      onChange={() => handleGrantTypeToggle(gt.id)}
                      label={gt.label}
                    />
                  ))}
                </div>
              </section>

              {/* Response Types */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-primary">Response Types</h3>
                <div className="flex flex-wrap gap-4">
                  {RESPONSE_TYPES.map((rt) => (
                    <Checkbox
                      key={rt.id}
                      isSelected={formData.response_types.includes(rt.id)}
                      onChange={() => handleResponseTypeToggle(rt.id)}
                      label={rt.label}
                    />
                  ))}
                </div>
              </section>

              {/* Redirect URIs */}
              <section className="flex items-start gap-8">
                <Label className="w-40 max-sm:hidden">Redirect URIs</Label>
                <TextArea
                  name="redirect_uris"
                  className="flex-1"
                  value={formData.redirect_uris}
                  onChange={(value) => setFormData({ ...formData, redirect_uris: value || '' })}
                  label="Redirect URIs (one per line)"
                  placeholder="http://localhost:3000/api/auth/callback"
                  rows={3}
                />
              </section>

              {/* Authentication */}
              <section className="space-y-6">
                <h3 className="text-sm font-semibold text-primary">Authentication</h3>
                
                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Token Endpoint Auth Method</Label>
                  <Select
                    selectedKey={formData.token_endpoint_auth_method}
                    onSelectionChange={(key) => setFormData({ ...formData, token_endpoint_auth_method: key as string })}
                    items={TOKEN_ENDPOINT_AUTH_METHODS}
                    className="flex-1"
                    label="Token Endpoint Auth Method"
                  >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                  </Select>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Subject Type</Label>
                  <Select
                    selectedKey={formData.subject_type}
                    onSelectionChange={(key) => setFormData({ ...formData, subject_type: key as string })}
                    items={SUBJECT_TYPES}
                    className="flex-1"
                    label="Subject Type"
                  >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                  </Select>
                </section>
              </section>

              {/* Advanced Settings */}
              <section className="space-y-6">
                <h3 className="text-sm font-semibold text-primary">Advanced Settings</h3>
                
                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Audience</Label>
                  <TextField name="audience" className="flex-1" value={formData.audience} onChange={(value) => setFormData({ ...formData, audience: value || '' })}>
                    <Label className="sm:hidden">Audience (comma-separated)</Label>
                    <InputBase size="md" placeholder="https://api.example.com" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Allowed CORS Origins</Label>
                  <TextArea
                    name="allowed_cors_origins"
                    className="flex-1"
                    value={formData.allowed_cors_origins}
                    onChange={(value) => setFormData({ ...formData, allowed_cors_origins: value || '' })}
                    label="Allowed CORS Origins (one per line)"
                    placeholder="https://example.com"
                    rows={2}
                  />
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Contacts</Label>
                  <TextField name="contacts" className="flex-1" value={formData.contacts} onChange={(value) => setFormData({ ...formData, contacts: value || '' })}>
                    <Label className="sm:hidden">Contacts (comma-separated emails)</Label>
                    <InputBase size="md" placeholder="admin@example.com" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">JWKS URI</Label>
                  <TextField name="jwks_uri" className="flex-1" value={formData.jwks_uri} onChange={(value) => setFormData({ ...formData, jwks_uri: value || '' })}>
                    <Label className="sm:hidden">JWKS URI</Label>
                    <InputBase size="md" placeholder="https://example.com/.well-known/jwks.json" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Logo URI</Label>
                  <TextField name="logo_uri" className="flex-1" value={formData.logo_uri} onChange={(value) => setFormData({ ...formData, logo_uri: value || '' })}>
                    <Label className="sm:hidden">Logo URI</Label>
                    <InputBase size="md" placeholder="https://example.com/logo.png" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Policy URI</Label>
                  <TextField name="policy_uri" className="flex-1" value={formData.policy_uri} onChange={(value) => setFormData({ ...formData, policy_uri: value || '' })}>
                    <Label className="sm:hidden">Policy URI</Label>
                    <InputBase size="md" placeholder="https://example.com/policy" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Terms of Service URI</Label>
                  <TextField name="tos_uri" className="flex-1" value={formData.tos_uri} onChange={(value) => setFormData({ ...formData, tos_uri: value || '' })}>
                    <Label className="sm:hidden">Terms of Service URI</Label>
                    <InputBase size="md" placeholder="https://example.com/tos" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Client URI</Label>
                  <TextField name="client_uri" className="flex-1" value={formData.client_uri} onChange={(value) => setFormData({ ...formData, client_uri: value || '' })}>
                    <Label className="sm:hidden">Client URI</Label>
                    <InputBase size="md" placeholder="https://example.com" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Sector Identifier URI</Label>
                  <TextField name="sector_identifier_uri" className="flex-1" value={formData.sector_identifier_uri} onChange={(value) => setFormData({ ...formData, sector_identifier_uri: value || '' })}>
                    <Label className="sm:hidden">Sector Identifier URI</Label>
                    <InputBase size="md" placeholder="https://example.com/sector" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Request URIs</Label>
                  <TextArea
                    name="request_uris"
                    className="flex-1"
                    value={formData.request_uris}
                    onChange={(value) => setFormData({ ...formData, request_uris: value || '' })}
                    label="Request URIs (one per line)"
                    placeholder="https://example.com/request"
                    rows={2}
                  />
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Request Object Signing Alg</Label>
                  <Select
                    selectedKey={formData.request_object_signing_alg || 'none'}
                    onSelectionChange={(key) => setFormData({ ...formData, request_object_signing_alg: key as string })}
                    items={SIGNING_ALGORITHMS}
                    className="flex-1"
                    label="Request Object Signing Algorithm"
                  >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                  </Select>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Userinfo Signed Response Alg</Label>
                  <Select
                    selectedKey={formData.userinfo_signed_response_alg || 'none'}
                    onSelectionChange={(key) => setFormData({ ...formData, userinfo_signed_response_alg: key as string })}
                    items={SIGNING_ALGORITHMS}
                    className="flex-1"
                    label="Userinfo Signed Response Algorithm"
                  >
                    {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                  </Select>
                </section>
              </section>

              {/* Logout Settings */}
              <section className="space-y-6">
                <h3 className="text-sm font-semibold text-primary">Logout Settings</h3>
                
                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Backchannel Logout URI</Label>
                  <TextField name="backchannel_logout_uri" className="flex-1" value={formData.backchannel_logout_uri} onChange={(value) => setFormData({ ...formData, backchannel_logout_uri: value || '' })}>
                    <Label className="sm:hidden">Backchannel Logout URI</Label>
                    <InputBase size="md" placeholder="https://example.com/backchannel-logout" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <div className="w-40 max-sm:hidden"></div>
                  <Checkbox
                    isSelected={formData.backchannel_logout_session_required}
                    onChange={(selected) => setFormData({ ...formData, backchannel_logout_session_required: selected })}
                  >
                    Backchannel Logout Session Required
                  </Checkbox>
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Post Logout Redirect URIs</Label>
                  <TextArea
                    name="post_logout_redirect_uris"
                    className="flex-1"
                    value={formData.post_logout_redirect_uris}
                    onChange={(value) => setFormData({ ...formData, post_logout_redirect_uris: value || '' })}
                    label="Post Logout Redirect URIs (one per line)"
                    placeholder="https://example.com/logout"
                    rows={2}
                  />
                </section>

                <section className="flex items-start gap-8">
                  <Label className="w-40 max-sm:hidden">Frontchannel Logout URI</Label>
                  <TextField name="frontchannel_logout_uri" className="flex-1" value={formData.frontchannel_logout_uri} onChange={(value) => setFormData({ ...formData, frontchannel_logout_uri: value || '' })}>
                    <Label className="sm:hidden">Frontchannel Logout URI</Label>
                    <InputBase size="md" placeholder="https://example.com/frontchannel-logout" />
                  </TextField>
                </section>

                <section className="flex items-start gap-8">
                  <div className="w-40 max-sm:hidden"></div>
                  <Checkbox
                    isSelected={formData.frontchannel_logout_session_required}
                    onChange={(selected) => setFormData({ ...formData, frontchannel_logout_session_required: selected })}
                  >
                    Frontchannel Logout Session Required
                  </Checkbox>
                </section>
              </section>

              {/* Metadata */}
              <section className="flex items-start gap-8">
                <Label className="w-40 max-sm:hidden">Metadata</Label>
                <TextArea
                  name="metadata"
                  className="flex-1"
                  value={formData.metadata}
                  onChange={(value) => setFormData({ ...formData, metadata: value || '' })}
                  label="Metadata (JSON object)"
                  placeholder='{"key": "value"}'
                  rows={4}
                />
              </section>

              <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                <Button 
                  color="secondary" 
                  size="lg" 
                  onClick={() => router.back()} 
                  type="button"
                  isDisabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  size="lg" 
                  isDisabled={updateMutation.isPending} 
                  type="submit"
                >
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <LoadingIndicator size="sm" />
                      Updating...
                    </span>
                  ) : (
                    'Update Client'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

