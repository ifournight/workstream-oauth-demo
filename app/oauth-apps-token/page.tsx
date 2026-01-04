import { dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { OAuthAppsTokenPageClient } from './oauth-apps-token-page-client'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getOryHydraAPI } from '@/generated/hydra-api'
import { getUserManagementAPIDocs } from '@/generated/ums-api'
import { getIdentityIdFromSession } from '@/lib/session'

/**
 * Server Component for OAuth Apps Token Page
 * Prefetches data on the server and passes it to the client component via hydration
 */
export default async function OAuthAppsTokenPage() {
  const queryClient = getQueryClient()
  
  // Prefetch global clients
  try {
    await queryClient.prefetchQuery({
      queryKey: ['clients'],
      queryFn: async () => {
        const api = getOryHydraAPI()
        const response = await api.listOAuth2Clients()
        const clients = Array.isArray(response.data) ? response.data : []
        
        // Transform to match client component expectations
        return clients.map((client: any, index: number) => ({
          ...client,
          id: client.client_id || client.id || `temp-client-${index}`,
        }))
      },
    })
  } catch (error) {
    // If prefetch fails, the query will still work on the client
    console.error('Failed to prefetch global clients:', error)
  }
  
  // Get identity ID from session for prefetching identity clients
  let identityId: string | null = null
  try {
    identityId = await getIdentityIdFromSession()
    
    // Prefetch identity clients if we have an identity ID
    if (identityId) {
      try {
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
        console.error('Failed to prefetch identity clients:', error)
      }
    }
  } catch (error) {
    // Session not available, will show authentication required on client
    console.log('No session available for identity clients prefetch')
  }
  
  // Dehydrate the query client state to pass to the client
  const dehydratedState = dehydrate(queryClient)
  
  // Clear the query client to free memory (important for SSR)
  queryClient.clear()
  
  return <OAuthAppsTokenPageClient dehydratedState={dehydratedState} identityId={identityId} />
}
