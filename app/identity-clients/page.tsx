'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { PageHeader } from '@/app/components/page-header'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

interface Client {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  grant_types?: string[]
  scope?: string
  redirect_uris?: string[]
  owner_identity_id?: string
}

const columns = [
  { id: 'client_id', name: 'Client ID' },
  { id: 'name', name: 'Name' },
  { id: 'grant_types', name: 'Grant Types' },
  { id: 'scopes', name: 'Scopes' },
  { id: 'actions', name: 'Actions' },
] as const

export default function IdentityClientsPage() {
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const lastErrorRef = useRef<string | null>(null)

  // Use identity ID directly from session
  const identityId = user?.identityId

  // Fetch clients for current user's identity
  const { data: clientsData, isLoading: loading, error } = useQuery({
    queryKey: ['identity-clients', identityId],
    queryFn: async () => {
      const response = await fetch(`/api/identity-clients`)
      const data = await response.json()
      
      if (!response.ok) {
        let errorMsg = data.error || 'Failed to load clients'
        if (data.details) {
          errorMsg += ` (${data.details})`
        }
        throw new Error(errorMsg)
      }
      
      const clientsWithId = Array.isArray(data) 
        ? data.map((client: Client) => ({
            ...client,
            id: client.client_id || client.id || `client-${Math.random().toString(36).substr(2, 9)}`,
          }))
        : []
      
      return clientsWithId
    },
    enabled: !!identityId && isAuthenticated,
  })

  const clients = clientsData || []

  // Update inputError when query has error
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setInputError(errorMessage)
      // Only show toast if this is a new error
      if (errorMessage !== lastErrorRef.current) {
        lastErrorRef.current = errorMessage
        toast.error('Failed to Load Clients', {
          description: errorMessage,
        })
      }
    } else {
      setInputError(null)
      lastErrorRef.current = null
    }
  }, [error])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!identityId) {
        throw new Error('Authentication required. Please log in.')
      }

      const response = await fetch(
        `/api/identity-clients/${clientId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }
    },
    onSuccess: (_: void, clientId: string) => {
      queryClient.invalidateQueries({ queryKey: ['identity-clients', identityId] })
      toast.success('Client Deleted', {
        description: `Client ${clientId} has been successfully deleted.`,
      })
    },
    onError: (err: Error) => {
      toast.error('Failed to Delete Client', {
        description: err.message,
      })
    },
  })

  async function handleDelete(clientId: string) {
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
      return
    }
    deleteMutation.mutate(clientId)
  }

  function handleCreate() {
    if (!user?.identityId) {
      toast.error('Authentication Required', {
        description: 'Please log in to create clients.',
      })
      return
    }
    // Navigate to create page (no need to pass identity_id in URL anymore)
    window.location.href = `/identity-clients/create`
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Identity-Specific Clients"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'Identity-Specific Clients' },
        ]}
        description="Manage OAuth clients for your identity. Clients are automatically loaded based on your current session."
        singleRow
        actions={
          <Button color="primary" onClick={handleCreate}>
            + Create Client
          </Button>
        }
      />


      {authLoading ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label="Checking authentication..." />
            </div>
          </CardContent>
        </Card>
      ) : !isAuthenticated || !identityId ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Illustration type="box" />
                </EmptyState.Header>
                <EmptyState.Content>
                  <EmptyState.Title>Authentication Required</EmptyState.Title>
                  <EmptyState.Description>Please log in to view and manage your identity-specific clients.</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label="Loading clients..." />
            </div>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Illustration type="box" />
                </EmptyState.Header>
                <EmptyState.Content>
                  <EmptyState.Title>No clients found</EmptyState.Title>
                  <EmptyState.Description>No clients found for this identity. Create your first client!</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TableCard.Root>
          <TableCard.Header
            title="Identity Clients"
            badge={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}
          />
          <Table aria-label="Identity clients table">
            <Table.Header columns={columns}>
              {(column) => <Table.Head>{column.name}</Table.Head>}
            </Table.Header>
            <Table.Body items={clients}>
              {(client: Client) => {
                const clientId = client.client_id || client.id || 'N/A'
                const clientName = client.client_name || client.name || 'N/A'
                const grantTypes = (client.grant_types || []).join(', ') || 'N/A'
                const scopes = client.scope || 'N/A'

                return (
                  <Table.Row columns={columns}>
                    {(column) => {
                      switch (column.id) {
                        case 'client_id':
                          return (
                            <Table.Cell>
                              <code className="bg-secondary px-2 py-1 rounded text-sm">{clientId}</code>
                            </Table.Cell>
                          )
                        case 'name':
                          return <Table.Cell>{clientName}</Table.Cell>
                        case 'grant_types':
                          return <Table.Cell className="text-sm text-tertiary">{grantTypes}</Table.Cell>
                        case 'scopes':
                          return <Table.Cell className="text-sm text-tertiary">{scopes}</Table.Cell>
                        case 'actions':
                          return (
                            <Table.Cell>
                              <div className="flex gap-2">
                                <Button color="secondary" size="sm" onClick={() => handleDelete(clientId)}>
                                  Delete
                                </Button>
                              </div>
                            </Table.Cell>
                          )
                        default:
                          return <Table.Cell />
                      }
                    }}
                  </Table.Row>
                )
              }}
            </Table.Body>
          </Table>
        </TableCard.Root>
      )}
    </div>
  )
}

