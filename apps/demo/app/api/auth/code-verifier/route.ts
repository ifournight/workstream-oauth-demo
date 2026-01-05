import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const codeVerifier = cookieStore.get('code_verifier')?.value

  if (!codeVerifier) {
    return NextResponse.json(
      { error: 'Code verifier not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ code_verifier: codeVerifier })
}

