'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HydrationBoundary, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { toast } from 'sonner'
import type { DehydratedState } from '@tanstack/react-query'

interface Client {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  grant_types?: string[]
  scope?: string
  redirect_uris?: string[]
}

const columns = [
  { id: 'client_id', name: 'Client ID' },
  { id: 'name', name: 'Name' },
  { id: 'grant_types', name: 'Grant Types' },
  { id: 'scopes', name: 'Scopes' },
  { id: 'actions', name: 'Actions' },
] as const

interface ClientsPageClientProps {
  dehydratedState: DehydratedState
}

export function ClientsPageClient({ dehydratedState }: ClientsPageClientProps) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <ClientsContent />
    </HydrationBoundary>
  )
}

function ClientsContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { setBreadcrumbs } = useBreadcrumbs()

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: 'Clients', href: '/clients' },
      { label: 'Global Clients' },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs])

  // Fetch clients - this will use the prefetched data from SSR
  const { data: clientsData, isLoading: loading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load clients')
      }
      const data = await response.json()
      const clientsWithId = Array.isArray(data) 
        ? data.map((client: Client, index: number) => ({
            ...client,
            // Ensure every client has a stable id for react-aria-components
            id: client.client_id || client.id || `temp-client-${index}`,
          }))
        : []
      
      if (clientsWithId.length > 0) {
        toast.success('Clients Loaded', {
          description: `Successfully loaded ${clientsWithId.length} client${clientsWithId.length === 1 ? '' : 's'}.`,
        })
      }
      
      return clientsWithId
    },
  })

  const clients = clientsData || []

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }
    },
    onSuccess: (_: void, clientId: string) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
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

  function handleEdit(client: Client) {
    const clientId = client.client_id || client.id
    if (clientId) {
      router.push(`/clients/${clientId}/edit`)
    }
  }

  function handleCreate() {
    router.push('/clients/create')
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Global Clients"
        description="Manage all OAuth clients in Hydra without identity filtering. View, create, edit, and delete clients across all identities."
        actions={
          <Button color="primary" onClick={handleCreate}>
            + Create Client
          </Button>
        }
      />

      {loading ? (
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
                  <EmptyState.Description>Create your first client to get started.</EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                  <Button color="primary" onClick={handleCreate}>
                    + Create Client
                  </Button>
                </EmptyState.Footer>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TableCard.Root>
          <TableCard.Header
            title="Clients"
            badge={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}
          />
          <Table aria-label="Clients table">
            <Table.Header columns={columns}>
              {(column) => <Table.Head>{column.name}</Table.Head>}
            </Table.Header>
            <Table.Body 
              items={clients}
              {...({ getKey: (client: Client) => client.id || client.client_id || 'unknown' } as any)}
            >
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
                                <Button color="secondary" size="sm" onClick={() => handleEdit(client)}>
                                  Edit
                                </Button>
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

