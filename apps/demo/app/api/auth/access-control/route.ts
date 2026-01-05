import { NextRequest, NextResponse } from 'next/server'
import { checkGlobalClientsAdminAccess } from '@/lib/access-control'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/access-control
 * Check if current user has access to global clients management
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const hasAccess = await checkGlobalClientsAdminAccess(cookieStore)
    
    // Debug logging
    const identityId = await import('@/lib/session').then(m => m.getIdentityIdFromSession(cookieStore))
    const whitelist = process.env.GLOBAL_CLIENTS_ADMIN_IDENTITY_IDS?.split(',').map(id => id.trim()).filter(Boolean) || []
    
    console.log('[Access Control] Identity ID:', identityId)
    console.log('[Access Control] Whitelist:', whitelist)
    console.log('[Access Control] Has Access:', hasAccess)
    
    return NextResponse.json({
      canManageGlobalClients: hasAccess,
    })
  } catch (error) {
    console.error('Error checking access control:', error)
    return NextResponse.json(
      { error: 'Failed to check access control', canManageGlobalClients: false },
      { status: 500 }
    )
  }
}

