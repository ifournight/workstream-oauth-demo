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

    // Build UMS URL with query parameters using URL constructor
    const apiUrl = buildUmsUrl('oauth-apps/v1', {
      owner_identity_id: identityId
    })
    
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

    // Get identity ID from session
    const identityId = await getIdentityIdFromSession()
    
    if (!identityId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    const clientData = await request.json()
    
    // Transform data format for UMS API
    // UMS Identity client API only accepts owner_identity_id and name
    // Use identity ID from session, not from request body
    const umsRequestData: any = {
      owner_identity_id: identityId,
      name: clientData.client_name || clientData.name,
    }
    
    const umsUrl = buildUmsUrl('oauth-apps/v1')
    const requestHeaders = {
      'Content-Type': 'application/json',
    }
    const requestBody = JSON.stringify(umsRequestData)
    
    // Log detailed request information for debugging
    console.log('='.repeat(80))
    console.log('[Create Identity Client] === REQUEST TO UMS ===')
    console.log('[Create Identity Client] URL:', umsUrl)
    console.log('[Create Identity Client] Method: POST')
    console.log('[Create Identity Client] Headers:', JSON.stringify(requestHeaders, null, 2))
    console.log('[Create Identity Client] Request Body:', requestBody)
    console.log('[Create Identity Client] Request Data (parsed):', JSON.stringify(umsRequestData, null, 2))
    console.log('[Create Identity Client] Identity ID from session:', identityId)
    console.log('='.repeat(80))
    
    let response: Response
    try {
      response = await fetch(umsUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
      })
    } catch (fetchError) {
      console.error('[Create Identity Client] === FETCH ERROR ===')
      console.error('[Create Identity Client] Error:', fetchError)
      console.error('[Create Identity Client] Error message:', fetchError instanceof Error ? fetchError.message : 'Unknown error')
      console.error('[Create Identity Client] Error stack:', fetchError instanceof Error ? fetchError.stack : 'No stack trace')
      console.error('='.repeat(80))
      throw fetchError
    }

    let data: any
    let rawResponse: string = ''
    const contentType = response.headers.get('content-type')
    
    // Capture all response headers for debugging
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })
    
    // Always capture raw response text first
    const responseText = await response.text()
    rawResponse = responseText
    
    // Log detailed response information for debugging
    console.log('='.repeat(80))
    console.log('[Create Identity Client] === RESPONSE FROM UMS ===')
    console.log('[Create Identity Client] Status:', response.status, response.statusText)
    console.log('[Create Identity Client] Status Code:', response.status)
    console.log('[Create Identity Client] Status Text:', response.statusText)
    console.log('[Create Identity Client] Response Headers:', JSON.stringify(responseHeaders, null, 2))
    console.log('[Create Identity Client] Content-Type:', contentType || 'Not specified')
    console.log('[Create Identity Client] Raw Response (as string):')
    console.log(rawResponse)
    console.log('[Create Identity Client] Raw Response Length:', rawResponse.length, 'bytes')
    console.log('[Create Identity Client] Raw Response (first 1000 chars):', rawResponse.substring(0, 1000))
    if (rawResponse.length > 1000) {
      console.log('[Create Identity Client] Raw Response (last 500 chars):', rawResponse.substring(rawResponse.length - 500))
    }
    console.log('='.repeat(80))
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseText)
        console.log('[Create Identity Client] Parsed JSON Response:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.error('[Create Identity Client] === JSON PARSE ERROR ===')
        console.error('[Create Identity Client] Parse Error:', e)
        console.error('[Create Identity Client] Raw Response that failed to parse:', rawResponse)
        console.error('='.repeat(80))
        data = { error: responseText || 'Unknown error', rawResponse: responseText }
      }
    } else {
      console.log('[Create Identity Client] Response is NOT JSON, Content-Type:', contentType)
      console.log('[Create Identity Client] Treating as non-JSON response')
      data = { error: responseText || 'Unknown error', rawResponse: responseText }
    }
    
    console.log('[Create Identity Client] Final Data Object:', JSON.stringify(data, null, 2))
    console.log('='.repeat(80))
    
    if (!response.ok) {
      console.error('[Create Identity Client] === ERROR RESPONSE ===')
      console.error('[Create Identity Client] Status:', response.status, response.statusText)
      console.error('[Create Identity Client] Response Data:', JSON.stringify(data, null, 2))
      console.error('[Create Identity Client] Raw Response:', rawResponse)
      console.error('[Create Identity Client] Response Headers:', JSON.stringify(responseHeaders, null, 2))
      console.error('='.repeat(80))
      
      return NextResponse.json(
        {
          error: data.error || data.message || 'Failed to create client',
          error_description: data.error_description,
          details: data,
          rawResponse: rawResponse,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: responseHeaders,
          contentType: contentType,
        },
        { status: response.status }
      )
    }
    
    // Parse successful response
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      // If parsing fails, treat as error even if status is 200
      console.error('[Create Identity Client] === PARSE ERROR (Status 200) ===')
      console.error('[Create Identity Client] Status was 200 but response is not valid JSON')
      console.error('[Create Identity Client] Parse Error:', e)
      console.error('[Create Identity Client] Raw Response:', rawResponse)
      console.error('[Create Identity Client] Content-Type:', contentType)
      console.error('[Create Identity Client] Response Headers:', JSON.stringify(responseHeaders, null, 2))
      console.error('='.repeat(80))
      
      return NextResponse.json(
        {
          error: 'Failed to parse response from UMS',
          error_description: 'The response from UMS was not valid JSON',
          details: { 
            parseError: e instanceof Error ? e.message : 'Unknown parse error',
            parseErrorStack: e instanceof Error ? e.stack : undefined,
          },
          rawResponse: rawResponse,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: responseHeaders,
          contentType: contentType,
        },
        { status: 500 }
      )
    }

    // Check if response contains error even with 200 status
    if (data.error || data.message) {
      console.error('[Create Identity Client] === ERROR IN SUCCESS RESPONSE ===')
      console.error('[Create Identity Client] Status was 200 but response contains error')
      console.error('[Create Identity Client] Error:', data.error || data.message)
      console.error('[Create Identity Client] Full Data:', JSON.stringify(data, null, 2))
      console.error('[Create Identity Client] Raw Response:', rawResponse)
      console.error('='.repeat(80))
      
      return NextResponse.json(
        {
          error: data.error || data.message || 'Failed to create client',
          error_description: data.error_description,
          details: data,
          rawResponse: rawResponse,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: responseHeaders,
          contentType: contentType,
        },
        { status: response.status >= 400 ? response.status : 400 }
      )
    }

    // Check if required fields are missing (indicates error)
    if (!data.id && !data.client_id && !data.name) {
      console.error('[Create Identity Client] === MISSING REQUIRED FIELDS ===')
      console.error('[Create Identity Client] Response missing required fields (id, client_id, or name)')
      console.error('[Create Identity Client] Response Data:', JSON.stringify(data, null, 2))
      console.error('[Create Identity Client] Available fields:', Object.keys(data))
      console.error('[Create Identity Client] Raw Response:', rawResponse)
      console.error('='.repeat(80))
      
      return NextResponse.json(
        {
          error: 'Invalid response from UMS: missing required fields',
          error_description: 'The response does not contain client_id, id, or name',
          details: {
            ...data,
            availableFields: Object.keys(data),
          },
          rawResponse: rawResponse,
          status: response.status,
          statusText: response.statusText,
          responseHeaders: responseHeaders,
          contentType: contentType,
        },
        { status: 500 }
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
      // Include raw response for display
      rawResponse: rawResponse,
      // Include debug information
      _debug: {
        responseHeaders: responseHeaders,
        contentType: contentType,
        status: response.status,
        statusText: response.statusText,
      },
      // Include all original fields
      ...data
    }

    console.log('[Create Identity Client] === SUCCESS ===')
    console.log('[Create Identity Client] Transformed Response:', JSON.stringify(transformedResponse, null, 2))
    console.log('='.repeat(80))

    return NextResponse.json(transformedResponse)
  } catch (error) {
    console.error('[Create Identity Client] === EXCEPTION ===')
    console.error('[Create Identity Client] Error:', error)
    console.error('[Create Identity Client] Error Message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[Create Identity Client] Error Stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('[Create Identity Client] Error Type:', error instanceof Error ? error.constructor.name : typeof error)
    if (error instanceof Error && 'cause' in error) {
      console.error('[Create Identity Client] Error Cause:', (error as any).cause)
    }
    console.error('='.repeat(80))
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorCause: error instanceof Error && 'cause' in error ? (error as any).cause : undefined,
      },
      { status: 500 }
    )
  }
}

