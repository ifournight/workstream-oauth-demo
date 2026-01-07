/**
 * Browser-side Hydra Admin API client
 * This client uses the generated API functions but with a browser-side mutator
 * to bypass server-side VPN requirements when deployed on Vercel
 * 
 * Note: This requires CORS to be enabled on the Hydra Admin API
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * Validate and normalize baseURL to ensure it's a valid URL
 * This prevents axios from using deprecated url.parse()
 */
function normalizeBaseUrl(url: string): string {
  if (!url) {
    return ''
  }
  
  try {
    // Use WHATWG URL API to validate and normalize the URL
    const urlObj = new URL(url)
    return urlObj.toString().replace(/\/$/, '') // Remove trailing slash
  } catch {
    // If URL is invalid, return as-is (axios will handle the error)
    return url
  }
}

/**
 * Get Hydra Admin URL for client-side use
 * Uses NEXT_PUBLIC_HYDRA_ADMIN_URL environment variable
 */
function getHydraAdminUrl(): string {
  if (typeof window === 'undefined') {
    throw new Error('This client can only be used in the browser')
  }
  
  const url = process.env.NEXT_PUBLIC_HYDRA_ADMIN_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_HYDRA_ADMIN_URL environment variable is not set')
  }
  
  return normalizeBaseUrl(url)
}

/**
 * Browser-side Hydra Admin API client instance
 * Configured with baseURL from environment variable (NEXT_PUBLIC_HYDRA_ADMIN_URL)
 */
export const hydraClientBrowser = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Browser-side mutator for Orval-generated Hydra API functions
 * This function is used to make API calls from the browser
 * It dynamically sets the baseURL from the environment variable
 */
export const hydraMutatorBrowser = async <T = any, D = any>(
  config: AxiosRequestConfig<D>
): Promise<AxiosResponse<T>> => {
  // Set baseURL dynamically from environment variable
  const baseURL = getHydraAdminUrl()
  
  // Create a new config with the baseURL
  const browserConfig: AxiosRequestConfig<D> = {
    ...config,
    baseURL,
  }
  
  return hydraClientBrowser.request<T, AxiosResponse<T>, D>(browserConfig)
}

/**
 * Browser-side version of getOryHydraAPI
 * This function returns the same API structure as the server-side version
 * but uses the browser-side mutator
 * 
 * Usage:
 * ```typescript
 * const api = getOryHydraAPIBrowser()
 * const response = await api.listOAuth2Clients()
 * ```
 */
export function getOryHydraAPIBrowser() {
  // Import the generated API functions
  // We need to create a version that uses hydraMutatorBrowser instead of hydraMutator
  // Since the generated file hardcodes the import, we'll create wrapper functions
  
  return {
    listOAuth2Clients: (params?: any) => {
      return hydraMutatorBrowser<any>(
        {
          url: '/admin/clients',
          method: 'GET',
          params,
        }
      )
    },
    createOAuth2Client: (oAuth2Client: any) => {
      return hydraMutatorBrowser<any>(
        {
          url: '/admin/clients',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: oAuth2Client,
        }
      )
    },
    getOAuth2Client: (id: string) => {
      return hydraMutatorBrowser<any>(
        {
          url: `/admin/clients/${id}`,
          method: 'GET',
        }
      )
    },
    setOAuth2Client: (id: string, oAuth2Client: any) => {
      return hydraMutatorBrowser<any>(
        {
          url: `/admin/clients/${id}`,
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          data: oAuth2Client,
        }
      )
    },
    deleteOAuth2Client: (id: string) => {
      return hydraMutatorBrowser<any>(
        {
          url: `/admin/clients/${id}`,
          method: 'DELETE',
        }
      )
    },
  }
}

/**
 * Convenience wrapper functions that match the manual implementation
 * These use the generated API structure but with browser-side mutator
 */

export interface HydraClient {
  client_id?: string
  id?: string
  client_name?: string
  name?: string
  grant_types?: string[]
  scope?: string
  redirect_uris?: string[]
  [key: string]: any
}

/**
 * List all OAuth 2.0 clients
 */
export async function listOAuth2ClientsBrowser(): Promise<HydraClient[]> {
  try {
    const api = getOryHydraAPIBrowser()
    const response = await api.listOAuth2Clients()
    
    if (!response.data) {
      return []
    }
    
    // Handle both array and object with data property
    const data = Array.isArray(response.data) ? response.data : (response.data as any)?.data || []
    return data
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to list clients'
    
    // Provide more specific error messages
    if (error.response) {
      const status = error.response.status
      const errorText = error.response.data?.error || error.response.data || errorMessage
      
      if (status === 405) {
        throw new Error(`Method Not Allowed (405): The endpoint does not support GET method. This might indicate an incorrect endpoint path or the API requires different authentication.`)
      } else if (status === 404) {
        throw new Error(`Not Found (404): The endpoint was not found. Please check if the Hydra Admin URL is correct.`)
      } else if (status === 401 || status === 403) {
        throw new Error(`Authentication Error (${status}): The Hydra Admin API requires authentication. ${errorText}`)
      }
      
      throw new Error(`Failed to list clients: ${status} ${errorText}`)
    }
    
    // Check for CORS or network errors
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      throw new Error(`CORS/Network Error: Unable to connect to Hydra Admin API. Please check CORS configuration. ${errorMessage}`)
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * Get a single OAuth 2.0 client by ID
 */
export async function getOAuth2ClientBrowser(clientId: string): Promise<HydraClient> {
  try {
    const api = getOryHydraAPIBrowser()
    const response = await api.getOAuth2Client(clientId)
    
    if (!response.data) {
      throw new Error('No data returned from API')
    }
    
    return response.data
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get client'
    
    if (error.response) {
      const status = error.response.status
      const errorText = error.response.data?.error || error.response.data || errorMessage
      
      if (status === 405) {
        throw new Error(`Method Not Allowed (405): The endpoint does not support GET method.`)
      } else if (status === 404) {
        throw new Error(`Not Found (404): Client ${clientId} not found or endpoint is incorrect.`)
      }
      
      throw new Error(`Failed to get client: ${status} ${errorText}`)
    }
    
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
      throw new Error(`CORS Error: Unable to connect to Hydra Admin API. ${errorMessage}`)
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * Create a new OAuth 2.0 client
 */
export async function createOAuth2ClientBrowser(clientData: Partial<HydraClient>): Promise<HydraClient> {
  try {
    const api = getOryHydraAPIBrowser()
    const response = await api.createOAuth2Client(clientData)
    
    if (!response.data) {
      throw new Error('No data returned from API')
    }
    
    return response.data
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create client'
    
    if (error.response) {
      const status = error.response.status
      const errorText = error.response.data?.error || error.response.data || errorMessage
      
      if (status === 405) {
        throw new Error(`Method Not Allowed (405): The endpoint does not support POST method.`)
      }
      
      throw new Error(`Failed to create client: ${status} ${errorText}`)
    }
    
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
      throw new Error(`CORS Error: Unable to connect to Hydra Admin API. ${errorMessage}`)
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * Update an existing OAuth 2.0 client
 */
export async function updateOAuth2ClientBrowser(
  clientId: string,
  clientData: Partial<HydraClient>
): Promise<HydraClient> {
  try {
    const api = getOryHydraAPIBrowser()
    const response = await api.setOAuth2Client(clientId, clientData)
    
    if (!response.data) {
      throw new Error('No data returned from API')
    }
    
    return response.data
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update client'
    
    if (error.response) {
      const status = error.response.status
      const errorText = error.response.data?.error || error.response.data || errorMessage
      
      if (status === 405) {
        throw new Error(`Method Not Allowed (405): The endpoint does not support PUT method.`)
      }
      
      throw new Error(`Failed to update client: ${status} ${errorText}`)
    }
    
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
      throw new Error(`CORS Error: Unable to connect to Hydra Admin API. ${errorMessage}`)
    }
    
    throw new Error(errorMessage)
  }
}

/**
 * Delete an OAuth 2.0 client
 */
export async function deleteOAuth2ClientBrowser(clientId: string): Promise<void> {
  try {
    const api = getOryHydraAPIBrowser()
    await api.deleteOAuth2Client(clientId)
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete client'
    
    if (error.response) {
      const status = error.response.status
      const errorText = error.response.data?.error || error.response.data || errorMessage
      
      if (status === 405) {
        throw new Error(`Method Not Allowed (405): The endpoint does not support DELETE method.`)
      }
      
      throw new Error(`Failed to delete client: ${status} ${errorText}`)
    }
    
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
      throw new Error(`CORS Error: Unable to connect to Hydra Admin API. ${errorMessage}`)
    }
    
    throw new Error(errorMessage)
  }
}
