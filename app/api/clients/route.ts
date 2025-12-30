import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${config.hydraAdminUrl}/admin/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch clients' },
        { status: response.status }
      )
    }

    const clients = await response.json()
    return NextResponse.json(Array.isArray(clients) ? clients : [])
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Check for certificate/SSL errors
    if (errorMessage.includes('certificate') || errorMessage.includes('SSL') || errorMessage.includes('TLS')) {
      return NextResponse.json(
        {
          error: 'VPN Connection Required',
          error_description: 'Unable to connect to Hydra admin endpoint. Please ensure you are connected to the company VPN.',
          details: errorMessage
        },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const clientData = await request.json()
    
    const response = await fetch(`${config.hydraAdminUrl}/admin/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create client', ...data },
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

