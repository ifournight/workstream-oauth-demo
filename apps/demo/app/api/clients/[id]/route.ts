import { NextRequest, NextResponse } from 'next/server'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getOryHydraAPI } from '@/generated/hydra-api'

// GET /api/clients/:id - Get a single client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const api = getOryHydraAPI()
    const response = await api.getOAuth2Client(clientId)

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to fetch client' },
        { status: 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const errorText = error.response.data?.error || error.response.data || 'Failed to fetch client'
      return NextResponse.json(
        { error: errorText },
        { status: error.response.status || 500 }
      )
    }
    
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
    
    // Import generated API functions from Orval
    const { getOryHydraAPI } = await import('@/generated/hydra-api')
    const api = getOryHydraAPI()
    
    const response = await api.setOAuth2Client(clientId, clientData)

    if (!response.data) {
      return NextResponse.json(
        { error: 'Failed to update client' },
        { status: 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const errorData = error.response.data
      return NextResponse.json(
        { error: errorData?.error || 'Failed to update client', ...errorData },
        { status: error.response.status || 500 }
      )
    }
    
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
    
    // Import generated API functions from Orval
    const { getOryHydraAPI } = await import('@/generated/hydra-api')
    const api = getOryHydraAPI()
    
    await api.deleteOAuth2Client(clientId)

    return NextResponse.json({ success: true, message: 'Client deleted successfully' })
  } catch (error: any) {
    // Handle axios errors
    if (error.response) {
      const errorText = error.response.data?.error || error.response.data || 'Failed to delete client'
      return NextResponse.json(
        { error: errorText },
        { status: error.response.status || 500 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

