import { dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { IdentityClientsPageClient } from './identity-clients-page-client'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getUserManagementAPIDocs } from '@/generated/ums-api'
import { getIdentityIdFromSession } from '@/lib/session'

// Force dynamic rendering since we use cookies for session
export const dynamic = 'force-dynamic'

/**
 * Server Component for Identity Clients Page
 * Prefetches data on the server and passes it to the client component via hydration
 */
export default async function IdentityClientsPage() {
  const queryClient = getQueryClient()
  
  // Get identity ID from session for prefetching
  let identityId: string | null = null
  try {
    identityId = await getIdentityIdFromSession()
  } catch (error) {
    // Session not available, will show authentication required on client
    console.log('No session available for identity clients prefetch')
  }
  
  // Only prefetch if we have an identity ID
  if (identityId) {
    try {
      // Prefetch clients data on the server
      await queryClient.prefetchQuery({
        queryKey: ['identity-clients', identityId],
        queryFn: async () => {
          const api = getUserManagementAPIDocs()
          const response = await api.listOauthApps({
            owner_identity_id: identityId!,
          })
          
          if (!response.data || !Array.isArray(response.data.apps)) {
            return []
          }
          
          const clients = response.data.apps
          
          // Transform to match client component expectations
          return clients.map((client: any, index: number) => ({
            ...client,
            client_id: client.client_id || client.id,
            client_name: client.name,
            scope: Array.isArray(client.scopes) ? client.scopes.join(' ') : (client.scope || ''),
            id: client.id || client.client_id || `temp-client-${index}`,
          }))
        },
      })
    } catch (error) {
      // If prefetch fails, the query will still work on the client
      // Only successful queries are included in dehydration
      console.error('Failed to prefetch identity clients:', error)
    }
  }
  
  // Dehydrate the query client state to pass to the client
  const dehydratedState = dehydrate(queryClient)
  
  // Clear the query client to free memory (important for SSR)
  queryClient.clear()
  
  return <IdentityClientsPageClient dehydratedState={dehydratedState} identityId={identityId} />
}
