import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// Helper function to build UMS URL using URL constructor for reliable path joining
function buildUmsUrl(path: string): string {
  if (!config.umsBaseUrl) {
    throw new Error('UMS_BASE_URL not configured')
  }
  // Use URL constructor to properly handle path joining regardless of trailing/leading slashes
  return new URL(path, config.umsBaseUrl).toString()
}

// POST /api/client-credentials/token - Get token using OAuth apps token flow (UMS implementation)
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

    const tokenUrl = buildUmsUrl('auth/v1/oauth-apps/token')
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
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

