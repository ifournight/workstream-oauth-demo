'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { Modal } from '@/app/components/ui/modal'
import { Input } from '@/components/base/input/input'
import { IconNotification } from '@/components/application/notifications/notifications'
import { PageHeader } from '@/app/components/page-header'
import { toast } from 'sonner'

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
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [identityId, setIdentityId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)

  async function loadClients() {
    if (!identityId.trim()) {
      setInputError('Please enter an Identity ID')
      toast.error('Identity ID Required', {
        description: 'Please enter an Identity ID to load clients.',
      })
      return
    }

    setInputError(null)

    try {
      setLoading(true)
      const response = await fetch(`/api/identity-clients?identity_id=${encodeURIComponent(identityId)}`)
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
      setClients(clientsWithId)
      toast.success('Clients Loaded', {
        description: `Successfully loaded ${clientsWithId.length} client${clientsWithId.length === 1 ? '' : 's'}.`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setClients([])
      toast.error('Failed to Load Clients', {
        description: errorMessage,
      })
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(clientId: string) {
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
      return
    }

    if (!identityId.trim()) {
      toast.error('Identity ID Required', {
        description: 'Identity ID is required to delete clients.',
      })
      return
    }

    try {
      const response = await fetch(
        `/api/identity-clients/${clientId}?identity_id=${encodeURIComponent(identityId)}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }

      await loadClients()
      toast.success('Client Deleted', {
        description: `Client ${clientId} has been successfully deleted.`,
      })
    } catch (err) {
      toast.error('Failed to Delete Client', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setShowModal(true)
  }

  function handleCreate() {
    if (!identityId.trim()) {
      toast.error('Identity ID Required', {
        description: 'Please enter an Identity ID first.',
      })
      return
    }
    setEditingClient(null)
    setShowModal(true)
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Identity-Specific Clients"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'Identity-Specific Clients' },
        ]}
        description="Manage OAuth clients scoped to a specific identity. Enter an identity UUID to view and manage associated clients."
        actions={
          identityId && (
            <Button color="primary" onClick={handleCreate}>
              + Create Client
            </Button>
          )
        }
      >
        <div className="flex gap-2 mt-4">
          <Input
            type="text"
            value={identityId}
            onChange={(value: string) => {
              setIdentityId(value)
              if (inputError && value.trim()) {
                setInputError(null)
              }
            }}
            placeholder="Enter identity UUID"
            className="flex-1 max-w-md"
            isRequired
            isInvalid={!!inputError}
            hint={inputError || undefined}
          />
          <Button onClick={loadClients} isDisabled={loading || !identityId.trim()} color="primary">
            {loading ? 'Loading...' : 'Load Clients'}
          </Button>
        </div>
      </PageHeader>


      {loading ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <LoadingIndicator size="md" label="Loading clients..." />
            </div>
          </CardContent>
        </Card>
      ) : !identityId.trim() ? (
        <Card>
          <CardContent>
            <div className="py-12">
              <EmptyState>
                <EmptyState.Header>
                  <EmptyState.Illustration type="box" />
                </EmptyState.Header>
                <EmptyState.Content>
                  <EmptyState.Title>Enter Identity ID</EmptyState.Title>
                  <EmptyState.Description>Please enter an Identity ID and click "Load Clients" to view clients.</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState>
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
                <EmptyState.Footer>
                  <Button color="primary" onClick={handleCreate}>
                    + Create Identity Client
                  </Button>
                </EmptyState.Footer>
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
              {(client) => {
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingClient(null)
        }}
        title={editingClient ? 'Edit Identity Client' : 'Create Identity Client'}
      >
        <IdentityClientModal
          client={editingClient}
          identityId={identityId}
          onClose={() => {
            setShowModal(false)
            setEditingClient(null)
          }}
          onSave={async () => {
            await loadClients()
            setShowModal(false)
            setEditingClient(null)
          }}
        />
      </Modal>
    </div>
  )
}

function IdentityClientModal({
  client,
  identityId,
  onClose,
  onSave,
}: {
  client: Client | null
  identityId: string
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    client_name: client?.client_name || client?.name || '',
    scope: client?.scope || 'openid offline',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const clientData = {
        owner_identity_id: identityId,
        client_name: formData.client_name,
        scope: formData.scope,
      }

      const url = client?.client_id || client?.id
        ? `/api/identity-clients/${client.client_id || client.id}?identity_id=${encodeURIComponent(identityId)}`
        : '/api/identity-clients'
      const method = client ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save client')
      }

      if (data.client_secret) {
        toast.success('Client Created', {
          description: `Client secret: ${data.client_secret}. Save this - it will not be shown again!`,
          duration: 10000,
        })
      } else {
        toast.success('Client Updated', {
          description: 'Client has been successfully updated.',
        })
      }

      onSave()
    } catch (err) {
      toast.error('Failed to Save Client', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Owner Identity ID"
        type="text"
        value={identityId}
        isDisabled
        className="bg-secondary"
      />

      <Input
        label="Client Name"
        type="text"
        value={formData.client_name}
        onChange={(value: string) => setFormData({ ...formData, client_name: value })}
        isRequired
      />

      <Input
        label="Scopes (space-separated)"
        type="text"
        value={formData.scope}
        onChange={(value: string) => setFormData({ ...formData, scope: value })}
        placeholder="openid offline"
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" color="primary" isDisabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

