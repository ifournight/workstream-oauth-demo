import { dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/get-query-client'
import { ClientsPageClient } from './clients-page-client'
// Server-side prefetch disabled - using browser-side API calls instead
// import { getOryHydraAPI } from '@/generated/hydra-api'

// Force dynamic rendering since we use cookies for session
export const dynamic = 'force-dynamic'

/**
 * Server Component for Clients Page
 * 
 * Note: Server-side prefetch is disabled because:
 * 1. Client-side now uses browser-side API calls directly to Hydra Admin API
 * 2. Server-side calls require VPN access which is not available on Vercel
 * 
 * The client component will fetch data directly from the browser using browser-side API
 */
export default async function ClientsPage() {
  // Access control removed - allow public access to /clients page
  
  const queryClient = getQueryClient()
  
  // Server-side prefetch disabled - client will fetch directly from browser
  // This avoids VPN requirements on Vercel deployments
  // try {
  //   // Prefetch clients data on the server
  //   await queryClient.prefetchQuery({
  //     queryKey: ['clients'],
  //     queryFn: async () => {
  //       const api = getOryHydraAPI()
  //       const response = await api.listOAuth2Clients()
  //       const clients = Array.isArray(response.data) ? response.data : []
  //       
  //       // Transform to match client component expectations
  //       return clients.map((client: any, index: number) => ({
  //         ...client,
  //         id: client.client_id || client.id || `temp-client-${index}`,
  //       }))
  //     },
  //   })
  // } catch (error) {
  //   // If prefetch fails, the query will still work on the client
  //   // Only successful queries are included in dehydration
  //   console.error('Failed to prefetch clients:', error)
  // }
  
  // Dehydrate the query client state to pass to the client
  const dehydratedState = dehydrate(queryClient)
  
  // Clear the query client to free memory (important for SSR)
  queryClient.clear()
  
  return <ClientsPageClient dehydratedState={dehydratedState} />
}
