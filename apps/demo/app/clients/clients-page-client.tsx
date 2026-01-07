'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HydrationBoundary, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { toast } from 'sonner'
import type { DehydratedState } from '@tanstack/react-query'
import { 
  useListOAuth2Clients,
  useDeleteOAuth2Client
} from '@/generated/hydra-api-browser'
import type { OAuth2Client } from '@/generated/hydra-api-browser/models'

// Use the generated OAuth2Client type
type Client = OAuth2Client & {
  id?: string // Add id for table row key
}

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
  const t = useTranslations('clients')
  const tCommon = useTranslations('common')
  const tTable = useTranslations('table')

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: tCommon('clients'), href: '/clients' },
      { label: t('globalClients') },
    ])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs, t, tCommon])

  const columns = [
    { id: 'client_id', name: tCommon('clientId') },
    { id: 'name', name: tCommon('name') },
    { id: 'grant_types', name: tTable('grantTypes') },
    { id: 'scopes', name: tTable('scopes') },
    { id: 'actions', name: tCommon('actions') },
  ] as const

  // Fetch clients using generated React Query hook
  const clientsQuery = useListOAuth2Clients(undefined, {
    query: {
      onSuccess: (data) => {
        const clients = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
        if (clients.length > 0) {
          toast.success(t('clientsLoaded'), {
            description: t('successfullyLoadedClients', { count: clients.length }),
          })
        }
      },
      onError: (err: any) => {
        const errorMessage = err?.message || 'Failed to load clients'
        // Check for CORS errors
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
          toast.error('CORS Error', {
            description: 'Unable to connect to Hydra Admin API. Please check CORS configuration.',
          })
        }
      },
    },
  })
  
  const { data: clientsData, isLoading: loading, error } = clientsQuery

  // Transform data to add id field for table rows
  // useListOAuth2Clients returns ListOAuth2ClientsResponse which is OAuth2Client[]
  const clients: Client[] = Array.isArray(clientsData?.data) 
    ? clientsData.data.map((client, index) => ({
        ...client,
        // Ensure every client has a stable id for react-aria-components
        id: client.client_id || `temp-client-${index}`,
      }))
    : Array.isArray(clientsData)
    ? clientsData.map((client, index) => ({
        ...client,
        id: client.client_id || `temp-client-${index}`,
      }))
    : []

  // Delete mutation using generated React Query hook
  const deleteMutation = useDeleteOAuth2Client({
    mutation: {
      onSuccess: (_: void, variables) => {
        // Invalidate the list query to refresh the data
        queryClient.invalidateQueries({ queryKey: clientsQuery.queryKey })
        toast.success(t('clientDeleted'), {
          description: t('clientSuccessfullyDeleted', { clientId: variables.id }),
        })
      },
      onError: (err: any) => {
        const errorMessage = err?.message || 'Failed to delete client'
        if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
          toast.error('CORS Error', {
            description: 'Unable to connect to Hydra Admin API. Please check CORS configuration.',
          })
        } else {
          toast.error(t('failedToDeleteClient'), {
            description: errorMessage,
          })
        }
      },
    },
  })

  async function handleDelete(clientId: string) {
    if (!confirm(t('areYouSureDelete', { clientId }))) {
      return
    }
    deleteMutation.mutate({ id: clientId })
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
        title={t('globalClients')}
        description={t('globalClientsDescription')}
        actions={
          <Button color="primary" onClick={handleCreate}>
            + {t('createClient')}
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label={t('loadingClients')} />
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
                  <EmptyState.Title>{t('noClientsFound')}</EmptyState.Title>
                  <EmptyState.Description>{t('createFirstClient')}</EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer>
                  <Button color="primary" onClick={handleCreate}>
                    + {t('createClient')}
                  </Button>
                </EmptyState.Footer>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TableCard.Root>
          <TableCard.Header
            title={tCommon('clients')}
            badge={t('clientCount', { count: clients.length })}
          />
          <Table aria-label={tCommon('clients')}>
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Head isRowHeader={column.id === 'client_id'}>
                  {column.name}
                </Table.Head>
              )}
            </Table.Header>
            <Table.Body 
              items={clients}
              {...({ getKey: (client: Client) => client.id || client.client_id || 'unknown' } as any)}
            >
              {(client: Client) => {
                const clientId = client.client_id || client.id || tCommon('n/a')
                const clientName = client.client_name || client.name || tCommon('n/a')
                const grantTypes = (client.grant_types || []).join(', ') || tCommon('n/a')
                const scopes = client.scope || tCommon('n/a')

                return (
                  <Table.Row columns={columns}>
                    {(column) => {
                      switch (column.id) {
                        case 'client_id':
                          return (
                            <Table.Cell isRowHeader>
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
                                  {tCommon('edit')}
                                </Button>
                                <Button color="secondary" size="sm" onClick={() => handleDelete(clientId)}>
                                  {tCommon('delete')}
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

