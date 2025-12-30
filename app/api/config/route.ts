import { NextResponse } from 'next/server'
import { config } from '@/lib/config'

// GET /api/config - Get public configuration (safe to expose to client)
export async function GET() {
  return NextResponse.json({
    hydraPublicUrl: config.hydraPublicUrl,
    clientId: config.clientId,
    // Don't expose secrets
  })
}

