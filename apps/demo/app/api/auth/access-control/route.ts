import { NextRequest, NextResponse } from 'next/server'
import { checkGlobalClientsAdminAccess } from '@/lib/access-control'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/access-control
 * Check if current user has access to global clients management
 * 
 * TEMPORARY: Access control is temporarily disabled - all users can access global clients
 * TODO: Re-enable access control when production VPN access is available
 */
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Always return true to allow all users to access global clients
    // Original access control check is commented out for now
    // const cookieStore = await cookies()
    // const hasAccess = await checkGlobalClientsAdminAccess(cookieStore)
    
    // Debug logging
    const cookieStore = await cookies()
    const identityId = await import('@/lib/session').then(m => m.getIdentityIdFromSession(cookieStore))
    const whitelist = process.env.GLOBAL_CLIENTS_ADMIN_IDENTITY_IDS?.split(',').map(id => id.trim()).filter(Boolean) || []
    
    console.log('[Access Control] Identity ID:', identityId)
    console.log('[Access Control] Whitelist:', whitelist)
    console.log('[Access Control] Has Access: true (temporarily disabled)')
    
    // TEMPORARY: Always return true
    return NextResponse.json({
      canManageGlobalClients: true,
    })
    
    // Original code (commented out):
    // return NextResponse.json({
    //   canManageGlobalClients: hasAccess,
    // })
  } catch (error) {
    console.error('Error checking access control:', error)
    // TEMPORARY: Return true even on error
    return NextResponse.json({
      canManageGlobalClients: true,
    })
    // Original code (commented out):
    // return NextResponse.json(
    //   { error: 'Failed to check access control', canManageGlobalClients: false },
    //   { status: 500 }
    // )
  }
}

