import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { getSession } from '@/lib/session'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getUserManagementAPIDocs } from '@/generated/ums-api'
import { setUmsAccessToken } from '@/lib/api/ums-client'

// POST /api/oauth-apps/token - Get token using OAuth apps token flow (UMS implementation)
export async function POST(request: NextRequest) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { client_id, client_secret } = body

    if (!client_id) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      )
    }

    if (!client_secret) {
      return NextResponse.json(
        { error: 'client_secret is required' },
        { status: 400 }
      )
    }

    // Get access token from session and set it for UMS API calls
    const cookieStore = await import('next/headers').then(m => m.cookies())
    const session = await getSession(cookieStore)
    if (session.accessToken) {
      setUmsAccessToken(session.accessToken)
    }

    try {
      const api = getUserManagementAPIDocs()
      const response = await api.oauthAppTokenExchange({
        client_id,
        client_secret,
      })

      if (!response.data) {
        return NextResponse.json(
          { error: 'Failed to get token' },
          { status: 500 }
        )
      }

      return NextResponse.json(response.data)
    } catch (fetchError: any) {
      // Handle axios errors
      if (fetchError.response) {
        const errorData = fetchError.response.data
        return NextResponse.json(
          { 
            error: errorData?.error_description || errorData?.error || 'Failed to get token',
            ...errorData
          },
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

