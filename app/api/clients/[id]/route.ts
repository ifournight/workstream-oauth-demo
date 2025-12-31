import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// GET /api/clients/:id - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const response = await fetch(`${config.hydraAdminUrl}/admin/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch client' },
        { status: response.status }
      )
    }

    const client = await response.json()
    return NextResponse.json(client)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/clients/:id - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const clientData = await request.json()
    
    const response = await fetch(`${config.hydraAdminUrl}/admin/clients/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update client', ...data },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/:id - Delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    
    const response = await fetch(`${config.hydraAdminUrl}/admin/clients/${clientId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to delete client' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: 'Client deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

