import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { getIdentityIdFromSession } from '@/lib/session'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getUserManagementAPIDocs } from '@/generated/ums-api'

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

    try {
      const api = getUserManagementAPIDocs()
      const response = await api.getOauthApp(clientId, {
        owner_identity_id: identityId,
      })

      if (!response.data) {
        return NextResponse.json(
          { error: 'Failed to fetch client' },
          { status: 500 }
        )
      }

      // Transform UMS response to match Hydra client format for frontend compatibility
      const transformedClient = {
        client_id: response.data.client_id || response.data.id,
        client_name: response.data.name,
        grant_types: response.data.grant_types || [],
        response_types: response.data.response_types || [],
        scope: Array.isArray(response.data.scopes) ? response.data.scopes.join(' ') : response.data.scopes || '',
        redirect_uris: response.data.redirect_uris || [],
        token_endpoint_auth_method: response.data.token_endpoint_auth_method || 'client_secret_post',
        owner_identity_id: response.data.owner_identity_id,
        ...response.data
      }
      return NextResponse.json(transformedClient)
    } catch (fetchError: any) {
      // Handle axios errors
      if (fetchError.response) {
        const errorText = fetchError.response.data?.error || fetchError.response.data || 'Failed to fetch client'
        return NextResponse.json(
          { error: errorText },
          { status: fetchError.response.status || 500 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
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
    
    // Import generated API functions from Orval
    const { getUserManagementAPIDocs } = await import('@/generated/ums-api')
    const api = getUserManagementAPIDocs()
    
    try {
      const response = await api.updateOauthApp(clientId, clientData, {
        owner_identity_id: identityId,
      })

      if (!response.data) {
        return NextResponse.json(
          { error: 'Failed to update client' },
          { status: 500 }
        )
      }

      return NextResponse.json(response.data)
    } catch (fetchError: any) {
      // Handle axios errors
      if (fetchError.response) {
        const errorData = fetchError.response.data
        return NextResponse.json(
          { error: errorData?.error || 'Failed to update client', ...errorData },
          { status: fetchError.response.status || 500 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
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

    // Import generated API functions from Orval
    const { getUserManagementAPIDocs } = await import('@/generated/ums-api')
    const api = getUserManagementAPIDocs()
    
    try {
      await api.deleteOauthApp(clientId, {
        owner_identity_id: identityId,
      })

      return NextResponse.json({ success: true, message: 'Client deleted successfully' })
    } catch (fetchError: any) {
      // Handle axios errors
      if (fetchError.response) {
        const errorText = fetchError.response.data?.error || fetchError.response.data || 'Failed to delete client'
        return NextResponse.json(
          { error: errorText },
          { status: fetchError.response.status || 500 }
        )
      }
      throw fetchError
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

