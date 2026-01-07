import { NextRequest, NextResponse } from 'next/server'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getOryHydraAPI } from '@/generated/hydra-api'

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    // Access control removed - allow public access
    const api = getOryHydraAPI()
    const response = await api.listOAuth2Clients()
    
    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    const clients = Array.isArray(response.data) ? response.data : []
    return NextResponse.json(clients)
  } catch (error: any) {
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
    
    // Handle axios errors
    if (error.response) {
      const errorText = error.response.data?.error || error.response.data || 'Failed to fetch clients'
      return NextResponse.json(
        { error: errorText },
        { status: error.response.status || 500 }
      )
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    // Access control removed - allow public access
    const clientData = await request.json()
    
    // Import generated API functions from Orval
    const { getOryHydraAPI } = await import('@/generated/hydra-api')
    const api = getOryHydraAPI()
    
    const response = await api.createOAuth2Client(clientData)
    
    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const errorData = error.response.data
      return NextResponse.json(
        { error: errorData?.error || 'Failed to create client', ...errorData },
        { status: error.response.status || 500 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

