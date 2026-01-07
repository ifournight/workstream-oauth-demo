import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/lib/config'

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
 * Hydra Admin API client instance
 * Configured with baseURL from environment config
 */
export const hydraClient = axios.create({
  baseURL: normalizeBaseUrl(config.hydraAdminUrl),
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Custom mutator for Orval-generated Hydra API functions
 * This function is used by Orval to make API calls
 */
export const hydraMutator = async <T = any, D = any>(
  config: AxiosRequestConfig<D>
): Promise<AxiosResponse<T>> => {
  return hydraClient.request<T, AxiosResponse<T>, D>(config)
}

