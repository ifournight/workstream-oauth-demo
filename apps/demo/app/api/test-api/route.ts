import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

// POST /api/test-api - Test API call with access token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token } = body

    if (!access_token) {
      return NextResponse.json(
        { error: 'access_token is required' },
        { status: 400 }
      )
    }

    const response = await fetch(config.testApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'x-core-company-id': config.companyId,
      },
    })

    const result: any = {
      status: response.status,
      statusText: response.statusText,
      success: response.ok && response.status !== 401,
    }

    if (response.ok) {
      result.data = await response.json()
    } else {
      result.error = await response.text()
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

