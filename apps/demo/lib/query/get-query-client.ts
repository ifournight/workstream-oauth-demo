import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

/**
 * Get or create a QueryClient instance for SSR
 * Uses React cache to ensure the same instance is used during a request
 * This follows the Next.js App Router pattern for SSR
 */
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  })
})

