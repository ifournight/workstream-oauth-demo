import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, redirect_uri, client_id, client_secret: providedSecret } = body

    if (!code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const codeVerifier = cookieStore.get('code_verifier')?.value
    const storedClientSecret = cookieStore.get('client_secret')?.value
    const storedClientId = cookieStore.get('flow_client_id')?.value
    const storedRedirectUri = cookieStore.get('flow_redirect_uri')?.value

    const finalClientId = client_id || storedClientId || config.clientId
    const finalClientSecret = providedSecret || storedClientSecret || config.clientSecret
    // Use stored redirect_uri to ensure it matches the one used in authorization request
    const finalRedirectUri = redirect_uri || storedRedirectUri

    if (!finalClientId) {
      return NextResponse.json(
        { error: 'client_id is required' },
        { status: 400 }
      )
    }

    if (!finalRedirectUri) {
      return NextResponse.json(
        { error: 'redirect_uri is required' },
        { status: 400 }
      )
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: finalRedirectUri,
      client_id: finalClientId,
      ...(finalClientSecret && { client_secret: finalClientSecret }),
      ...(codeVerifier && { code_verifier: codeVerifier }),
    })

    const tokenResponse = await fetch(`${config.hydraPublicUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString(),
    })

    const data = await tokenResponse.json()

    if (!tokenResponse.ok) {
      return NextResponse.json(
        {
          error: data.error || 'Token exchange failed',
          error_description: data.error_description,
          ...data,
        },
        { status: tokenResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

