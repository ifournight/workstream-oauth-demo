import { dehydrate } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { getQueryClient } from '@/lib/query/get-query-client'
import { ClientsPageClient } from './clients-page-client'
// Import generated API functions from Orval
// Note: Run `bun run generate:api` first to generate these functions
import { getOryHydraAPI } from '@/generated/hydra-api'
import { checkGlobalClientsAdminAccess } from '@/lib/access-control'

// Force dynamic rendering since we use cookies for session
export const dynamic = 'force-dynamic'

/**
 * Server Component for Clients Page
 * Prefetches data on the server and passes it to the client component via hydration
 */
export default async function ClientsPage() {
  // Check access control on server side
  const hasAccess = await checkGlobalClientsAdminAccess()
  
  if (!hasAccess) {
    // Redirect to home page if user doesn't have access
    redirect('/')
  }
  
  const queryClient = getQueryClient()
  
  try {
    // Prefetch clients data on the server
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
    // Only successful queries are included in dehydration
    console.error('Failed to prefetch clients:', error)
  }
  
  // Dehydrate the query client state to pass to the client
  const dehydratedState = dehydrate(queryClient)
  
  // Clear the query client to free memory (important for SSR)
  queryClient.clear()
  
  return <ClientsPageClient dehydratedState={dehydratedState} />
}
