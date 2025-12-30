'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { Table, TableCard } from '@/components/application/table/table'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { Modal } from '@/app/components/ui/modal'
import { Input } from '@/components/base/input/input'
import { Alert } from '@/app/components/ui/alert'
import { PageHeader } from '@/app/components/page-header'

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

export default function GlobalClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/clients')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load clients')
      }
      const data = await response.json()
      const clientsWithId = Array.isArray(data) 
        ? data.map((client: Client) => ({
            ...client,
            id: client.client_id || client.id || `client-${Math.random().toString(36).substr(2, 9)}`,
          }))
        : []
      setClients(clientsWithId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(clientId: string) {
    if (!confirm(`Are you sure you want to delete client ${clientId}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }

      await loadClients()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setShowModal(true)
  }

  function handleCreate() {
    setEditingClient(null)
    setShowModal(true)
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Global Clients"
        breadcrumbs={[
          { label: 'Clients', href: '#' },
          { label: 'Global Clients' },
        ]}
        description="Manage all OAuth clients directly in Hydra. No identity filtering - shows all clients."
        actions={
          <Button color="primary" onClick={handleCreate}>
            + Create Client
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

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
        title={editingClient ? 'Edit Client' : 'Create Client'}
      >
        <ClientModal
          client={editingClient}
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

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Client | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    client_name: client?.client_name || client?.name || '',
    scope: client?.scope || 'openid offline',
    redirect_uris: (client?.redirect_uris || []).join('\n'),
    grant_types: client?.grant_types || ['authorization_code'],
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const clientData = {
        client_name: formData.client_name,
        scope: formData.scope,
        redirect_uris: formData.redirect_uris.split('\n').filter((uri) => uri.trim()),
        grant_types: formData.grant_types,
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post',
      }

      const url = client?.client_id || client?.id
        ? `/api/clients/${client.client_id || client.id}`
        : '/api/clients'
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
        alert(`Client created! Secret: ${data.client_secret} (Save this! It will not be shown again.)`)
      }

      onSave()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <label className="block text-sm font-medium text-secondary mb-1">
          Redirect URIs (one per line)
        </label>
        <textarea
          value={formData.redirect_uris}
          onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
          className="w-full px-3 py-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          rows={3}
          placeholder="http://localhost:3000/callback"
        />
      </div>

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

