'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

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

export default function IdentityClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [identityId, setIdentityId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  async function loadClients() {
    if (!identityId.trim()) {
      setError('Please enter an Identity ID')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/identity-clients?identity_id=${encodeURIComponent(identityId)}`)
      const data = await response.json()
      
      if (!response.ok) {
        // Show more detailed error message
        let errorMsg = data.error || 'Failed to load clients'
        if (data.details) {
          errorMsg += ` (${data.details})`
        }
        throw new Error(errorMsg)
      }
      
      setClients(Array.isArray(data) ? data : [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setClients([])
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
      alert('Identity ID is required')
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  function handleEdit(client: Client) {
    setEditingClient(client)
    setShowModal(true)
  }

  function handleCreate() {
    if (!identityId.trim()) {
      alert('Please enter an Identity ID first')
      return
    }
    setEditingClient(null)
    setShowModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Identity-Specific Clients Management</h1>
        <Link href="/">
          <Button variant="secondary">← Back to Home</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              value={identityId}
              onChange={(e) => setIdentityId(e.target.value)}
              placeholder="Enter identity UUID"
              className="flex-1"
            />
            <Button onClick={loadClients} disabled={loading} variant="primary">
              {loading ? 'Loading...' : 'Load Clients'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {identityId && (
        <div className="mb-4 flex justify-end">
          <Button variant="success" onClick={handleCreate}>
            + Create Identity Client
          </Button>
        </div>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <p>Loading clients...</p>
          </CardContent>
        </Card>
      ) : clients.length === 0 && identityId ? (
        <Card>
          <CardContent>
            <p className="text-gray-600">No clients found for this identity. Create your first client!</p>
          </CardContent>
        </Card>
      ) : !identityId ? (
        <Card>
          <CardContent>
            <p className="text-gray-600">Please enter an Identity ID and click "Load Clients" to view clients.</p>
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
                        <Button variant="primary" size="sm" onClick={() => handleEdit(client)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(clientId)}>
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
        label="Owner Identity ID"
        type="text"
        value={identityId}
        disabled
        className="bg-gray-100"
      />

      <Input
        label="Client Name"
        type="text"
        value={formData.client_name}
        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
        required
      />

      <Input
        label="Scopes (space-separated)"
        type="text"
        value={formData.scope}
        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
        placeholder="openid offline"
      />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

