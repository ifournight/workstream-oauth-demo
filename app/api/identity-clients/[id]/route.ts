import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { getIdentityIdFromSession } from '@/lib/session'

// Helper function to build UMS URL using URL constructor for reliable path joining
// Handles all cases: base URL with/without trailing slash, path with/without leading slash
function buildUmsUrl(path: string, searchParams?: Record<string, string>): string {
  if (!config.umsBaseUrl) {
    throw new Error('UMS_BASE_URL not configured')
  }
  // Use URL constructor to properly handle path joining regardless of trailing/leading slashes
  const url = new URL(path, config.umsBaseUrl)
  
  // Add search parameters if provided
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

// GET /api/identity-clients/:id - Get a single identity client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    // Get identity ID from session
    const identityId = await getIdentityIdFromSession()
    
    if (!identityId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params

    const apiUrl = buildUmsUrl(`oauth-apps/v1/${clientId}`, {
      owner_identity_id: identityId
    })
    
    const response = await fetch(
      apiUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch client' },
        { status: response.status }
      )
    }

    const client = await response.json()
    // Transform UMS response to match Hydra client format for frontend compatibility
    const transformedClient = {
      client_id: client.client_id || client.id,
      client_name: client.name,
      grant_types: client.grant_types || [],
      response_types: client.response_types || [],
      scope: Array.isArray(client.scopes) ? client.scopes.join(' ') : client.scopes || '',
      redirect_uris: client.redirect_uris || [],
      token_endpoint_auth_method: client.token_endpoint_auth_method || 'client_secret_post',
      owner_identity_id: client.owner_identity_id,
      ...client
    }
    return NextResponse.json(transformedClient)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT /api/identity-clients/:id - Update an identity client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    // Get identity ID from session
    const identityId = await getIdentityIdFromSession()
    
    if (!identityId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params

    const clientData = await request.json()
    
    const apiUrl = buildUmsUrl(`oauth-apps/v1/${clientId}`, {
      owner_identity_id: identityId
    })
    
    const response = await fetch(
      apiUrl,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      }
    )

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

// DELETE /api/identity-clients/:id - Delete an identity client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    // Get identity ID from session
    const identityId = await getIdentityIdFromSession()
    
    if (!identityId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    const { id: clientId } = await params

    const apiUrl = buildUmsUrl(`oauth-apps/v1/${clientId}`, {
      owner_identity_id: identityId
    })
    
    const response = await fetch(
      apiUrl,
      {
        method: 'DELETE',
      }
    )

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

