import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/lib/config'

/**
 * UMS API client instance
 * Configured with baseURL from environment config
 * Note: Identity authentication is handled in API routes, not here
 */
export const umsClient = axios.create({
  baseURL: config.umsBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Custom mutator for Orval-generated UMS API functions
 * This function is used by Orval to make API calls
 */
export const umsMutator = async <T = any, D = any>(
  config: AxiosRequestConfig<D>
): Promise<AxiosResponse<T>> => {
  return umsClient.request<T, AxiosResponse<T>, D>(config)
}

