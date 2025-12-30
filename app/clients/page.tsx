'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/base/buttons/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/base/input/input'
import { Alert } from '@/components/ui/alert'

interface Client {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  grant_types?: string[]
  scope?: string
  redirect_uris?: string[]
}

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
      setClients(Array.isArray(data) ? data : [])
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Global Clients Management</h1>
        <div className="flex gap-4">
          <Link href="/">
            <Button color="secondary">← Back to Home</Button>
          </Link>
          <Button color="primary" onClick={handleCreate}>
            + Create Client
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <p>Loading clients...</p>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-gray-600">No clients found. Create your first client!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grant Types</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => {
                const clientId = client.client_id || client.id || 'N/A'
                const clientName = client.client_name || client.name || 'N/A'
                const grantTypes = (client.grant_types || []).join(', ') || 'N/A'
                const scopes = client.scope || 'N/A'

                return (
                  <TableRow key={clientId}>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{clientId}</code>
                    </TableCell>
                    <TableCell>{clientName}</TableCell>
                    <TableCell className="text-sm text-gray-500">{grantTypes}</TableCell>
                    <TableCell className="text-sm text-gray-500">{scopes}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button color="primary" size="sm" onClick={() => handleEdit(client)}>
                          Edit
                        </Button>
                        <Button color="primary-destructive" size="sm" onClick={() => handleDelete(clientId)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </tbody>
          </Table>
        </Card>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Redirect URIs (one per line)
        </label>
        <textarea
          value={formData.redirect_uris}
          onChange={(e) => setFormData({ ...formData, redirect_uris: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

