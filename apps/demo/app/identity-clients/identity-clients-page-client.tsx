'use client'

import { useEffect, useRef } from 'react'
import { HydrationBoundary, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { PageHeader } from '@/app/components/page-header'
import { useBreadcrumbs } from '@/lib/breadcrumbs'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import type { DehydratedState } from '@tanstack/react-query'

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

interface IdentityClientsPageClientProps {
  dehydratedState: DehydratedState
  identityId: string | null
}

export function IdentityClientsPageClient({ dehydratedState, identityId }: IdentityClientsPageClientProps) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <IdentityClientsContent identityId={identityId} />
    </HydrationBoundary>
  )
}

function IdentityClientsContent({ identityId }: { identityId: string | null }) {
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { setBreadcrumbs } = useBreadcrumbs()
  const lastErrorRef = useRef<string | null>(null)
  const t = useTranslations('clients')
  const tCommon = useTranslations('common')
  const tTable = useTranslations('table')
  const tAuth = useTranslations('auth')

  // Use identity ID from props (from server) or from session (fallback)
  const currentIdentityId = identityId || user?.identityId

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs([
      { label: tCommon('clients'), href: '/clients' },
      { label: t('myOAuthClients') },
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

  // Fetch clients for current user's identity - this will use the prefetched data from SSR
  // Call Next.js API route which handles CORS and authentication
  const { data: clientsData, isLoading: loading, error } = useQuery({
    queryKey: ['identity-clients', currentIdentityId],
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
        ? data.map((client: Client, index: number) => ({
            ...client,
            // Ensure every client has a stable id for react-aria-components
            id: client.client_id || client.id || `temp-client-${index}`,
          }))
        : []
      
      return clientsWithId
    },
    enabled: !!currentIdentityId && isAuthenticated,
  })

  const clients = clientsData || []

  // Show error toast when query has error
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Only show toast if this is a new error
      if (errorMessage !== lastErrorRef.current) {
        lastErrorRef.current = errorMessage
        toast.error(t('failedToLoadClients'), {
          description: errorMessage,
        })
      }
    } else {
      lastErrorRef.current = null
    }
  }, [error])

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!currentIdentityId) {
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
      queryClient.invalidateQueries({ queryKey: ['identity-clients', currentIdentityId] })
      toast.success(t('clientDeleted'), {
        description: t('clientSuccessfullyDeleted', { clientId }),
      })
    },
    onError: (err: Error) => {
      toast.error(t('failedToDeleteClient'), {
        description: err.message,
      })
    },
  })

  async function handleDelete(clientId: string) {
    if (!confirm(t('areYouSureDelete', { clientId }))) {
      return
    }
    deleteMutation.mutate(clientId)
  }

  function handleCreate() {
    if (!user?.identityId && !currentIdentityId) {
      toast.error(tAuth('authenticationRequired'), {
        description: tAuth('pleaseLogIn'),
      })
      return
    }
    // Navigate to create page (no need to pass identity_id in URL anymore)
    window.location.href = `/identity-clients/create`
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title={t('myOAuthClients')}
        description={t('myOAuthClientsDescription')}
        singleRow
        actions={
          <Button color="primary" onClick={handleCreate}>
            + {t('createClient')}
          </Button>
        }
      />

      {authLoading ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label={t('checkingAuthentication')} />
            </div>
          </CardContent>
        </Card>
      ) : !isAuthenticated || !currentIdentityId ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Illustration type="box" />
                </EmptyState.Header>
                <EmptyState.Content>
                  <EmptyState.Title>{tAuth('authenticationRequired')}</EmptyState.Title>
                  <EmptyState.Description>{tAuth('pleaseLogInToView')}</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : loading ? (
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
                  <EmptyState.Description>{t('noOAuthClientsFound')}</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState>
            </div>
          </CardContent>
        </Card>
      ) : (
        <TableCard.Root>
          <TableCard.Header
            title={t('myOAuthClients')}
            badge={t('clientCount', { count: clients.length })}
          />
          <Table aria-label={t('myOAuthClients')}>
            <Table.Header columns={columns}>
              {(column) => <Table.Head>{column.name}</Table.Head>}
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

