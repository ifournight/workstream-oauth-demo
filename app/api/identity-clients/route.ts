import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// GET /api/identity-clients - List clients for an identity
export async function GET(request: NextRequest) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const identityId = searchParams.get('identity_id')
    
    if (!identityId) {
      return NextResponse.json(
        { error: 'identity_id query parameter is required' },
        { status: 400 }
      )
    }

    // Ensure UMS URL doesn't have trailing slash issues
    const umsUrl = config.umsBaseUrl.replace(/\/$/, '')
    const apiUrl = `${umsUrl}/oauth-apps/v1?owner_identity_id=${encodeURIComponent(identityId)}`
    
    console.log('[Get Identity Clients] Requesting:', apiUrl)
    
    let response: Response
    try {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (fetchError) {
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
      return NextResponse.json(
        { 
          error: 'Network error: ' + errorMessage,
          details: errorMessage
        },
        { status: 500 }
      )
    }

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json(
        { error: error || 'Failed to fetch clients' },
        { status: response.status }
      )
    }

    const clients = await response.json()
    const clientsArray = Array.isArray(clients) ? clients : []
    
    // Transform UMS response format to match Hydra format for frontend compatibility
    const transformedClients = clientsArray.map((client: any) => ({
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
  } catch (error) {
    console.error('[Get Identity Clients] Exception:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    // Provide more helpful error messages
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { 
          error: 'Unable to connect to UMS server. Please check your VPN connection and UMS_BASE_URL configuration.',
          details: errorMessage
        },
        { status: 503 }
      )
    }
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

    const clientData = await request.json()
    
    if (!clientData.owner_identity_id) {
      return NextResponse.json(
        { error: 'owner_identity_id is required in request body' },
        { status: 400 }
      )
    }
    
    // Transform data format for UMS API
    const umsRequestData: any = {
      owner_identity_id: clientData.owner_identity_id,
      name: clientData.client_name || clientData.name,
      description: clientData.description || `OAuth application '${clientData.client_name || clientData.name}' for identity ${clientData.owner_identity_id}`,
      // UMS expects scopes as an array of strings
      scopes: clientData.scope ? clientData.scope.split(/\s+/).filter((s: string) => s.length > 0) : ['openid', 'offline_access'],
    }
    
    console.log('[Create Identity Client] Request to UMS:', JSON.stringify(umsRequestData, null, 2))
    console.log('[Create Identity Client] UMS URL:', `${config.umsBaseUrl}/oauth-apps/v1`)
    
    const response = await fetch(`${config.umsBaseUrl}/oauth-apps/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(umsRequestData),
    })

    let data: any
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      data = { error: text || 'Unknown error', rawResponse: text }
    }
    
    console.log('[Create Identity Client] UMS Response:', response.status, JSON.stringify(data, null, 2))
    
    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.error || data.message || 'Failed to create client',
          error_description: data.error_description,
          details: data,
          status: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      )
    }

    // Transform UMS response to match Hydra client format for frontend compatibility
    const transformedResponse = {
      client_id: data.client_id || data.id,
      client_secret: data.client_secret,
      client_name: data.name,
      grant_types: data.grant_types || ['client_credentials'],
      response_types: data.response_types || ['code'],
      scope: Array.isArray(data.scopes) ? data.scopes.join(' ') : data.scopes || '',
      redirect_uris: data.redirect_uris || [],
      token_endpoint_auth_method: data.token_endpoint_auth_method || 'client_secret_post',
      owner_identity_id: data.owner_identity_id,
      // Include all original fields
      ...data
    }

    return NextResponse.json(transformedResponse)
  } catch (error) {
    console.error('[Create Identity Client] Exception:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

