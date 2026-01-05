import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { getIdentityIdFromSession, getSession } from '@/lib/session'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getUserManagementAPIDocs } from '@/generated/ums-api'
import { setUmsAccessToken } from '@/lib/api/ums-client'

// GET /api/identity-clients - List clients for an identity
export async function GET(request: NextRequest) {
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

    console.log('[Get Identity Clients] Identity ID:', identityId)
    
    // Get access token from session and set it for UMS API calls
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const session = await getSession(cookieStore)
    if (session.accessToken) {
      setUmsAccessToken(session.accessToken)
    }
    
    try {
      // Call generated UMS API function with owner_identity_id query parameter
      const api = getUserManagementAPIDocs()
      const response = await api.listOauthApps({
        owner_identity_id: identityId,
      })

      if (!response.data) {
        return NextResponse.json(
          { error: 'Failed to fetch clients' },
          { status: 500 }
        )
      }

      // UMS API returns { apps: [...] } format, extract the apps array
      const clients = Array.isArray(response.data.apps) ? response.data.apps : []
      console.log('[Get Identity Clients] Fetched', clients.length, 'clients')
      
      // Transform UMS response format to match Hydra format for frontend compatibility
      const transformedClients = clients.map((client: any) => ({
        client_id: client.client_id || client.id,
        client_name: client.name,
        scope: Array.isArray(client.scopes) ? client.scopes.join(' ') : (client.scope || ''),
        id: client.id,
        name: client.name,
        description: client.description,
        scopes: client.scopes,
        created_at: client.created_at,
        owner_identity_id: client.owner_identity_id,
        // Include all original fields
        ...client
      }))
      
      return NextResponse.json(transformedClients)
    } catch (fetchError: any) {
      console.error('[Get Identity Clients] Fetch error:', fetchError)
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'
      
      // Check for common network errors
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Unable to connect to UMS server. Please check your VPN connection and UMS_BASE_URL configuration.',
            details: errorMessage
          },
          { status: 503 }
        )
      }
      
      // Handle axios errors
      if (fetchError.response) {
        const errorText = fetchError.response.data?.error || fetchError.response.data || 'Failed to fetch clients'
        return NextResponse.json(
          { error: errorText },
          { status: fetchError.response.status || 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Network error: ' + errorMessage,
          details: errorMessage
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Get Identity Clients] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// POST /api/identity-clients - Create a new identity client
export async function POST(request: NextRequest) {
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

    const clientData = await request.json()
    
    // Get access token from session and set it for UMS API calls
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const session = await getSession(cookieStore)
    if (session.accessToken) {
      setUmsAccessToken(session.accessToken)
    }
    
    // Import generated API functions from Orval
    const { getUserManagementAPIDocs } = await import('@/generated/ums-api')
    const api = getUserManagementAPIDocs()
    
    // Transform data format for UMS API
    // UMS Identity client API only accepts owner_identity_id and name
    // Use identity ID from session, not from request body
    const umsRequestData = {
      owner_identity_id: identityId,
      name: clientData.client_name || clientData.name,
    }
    
    console.log('[Create Identity Client] Creating client for identity:', identityId)
    
    try {
      const response = await api.createOauthApp(umsRequestData)

      if (!response.data) {
        return NextResponse.json(
          { error: 'Failed to create client' },
          { status: 500 }
        )
      }

      // Transform UMS response to match Hydra client format for frontend compatibility
      // Note: UMS API response doesn't include grant_types, response_types, etc.
      // These are provided as defaults for frontend compatibility
      const transformedResponse = {
        client_id: response.data.client_id || response.data.id,
        client_secret: response.data.client_secret,
        client_name: response.data.name,
        grant_types: (response.data as any).grant_types || ['client_credentials'],
        response_types: (response.data as any).response_types || ['code'],
        scope: Array.isArray(response.data.scopes) ? response.data.scopes.join(' ') : response.data.scopes || '',
        redirect_uris: (response.data as any).redirect_uris || [],
        token_endpoint_auth_method: (response.data as any).token_endpoint_auth_method || 'client_secret_post',
        owner_identity_id: (response.data as any).owner_identity_id,
        // Include all original fields
        ...response.data
      }

      console.log('[Create Identity Client] Success!')
      return NextResponse.json(transformedResponse)
    } catch (fetchError: any) {
      console.error('[Create Identity Client] Error:', fetchError)
      
      // Handle axios errors
      if (fetchError.response) {
        const errorData = fetchError.response.data
        return NextResponse.json(
          { 
            error: errorData?.error || errorData?.message || 'Failed to create client',
            details: errorData
          },
          { status: fetchError.response.status || 500 }
        )
      }
      
      // Handle network errors
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error'
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Unable to connect to UMS server. Please check your VPN connection and UMS_BASE_URL configuration.',
            details: errorMessage
          },
          { status: 503 }
        )
      }
      
      throw fetchError
    }
  } catch (error: any) {
    console.error('[Create Identity Client] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

