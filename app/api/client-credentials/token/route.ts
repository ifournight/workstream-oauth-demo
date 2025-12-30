import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// POST /api/client-credentials/token - Get token using client credentials flow
export async function POST(request: NextRequest) {
  try {
    if (!config.umsBaseUrl) {
      return NextResponse.json(
        { error: 'UMS_BASE_URL not configured. Please set it as an environment variable.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { client_id, client_secret, scope } = body

    const response = await fetch(`${config.umsBaseUrl}/auth/v1/oauth-apps/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: client_id || config.clientId,
        client_secret: client_secret || config.clientSecret,
        scope: scope || 'openid offline',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error_description || data.error || 'Failed to get token', ...data },
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

