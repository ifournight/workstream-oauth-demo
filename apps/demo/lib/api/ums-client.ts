import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { config } from '@/lib/config'

/**
 * UMS API client instance
 * Configured with baseURL from environment config
 */
export const umsClient = axios.create({
  baseURL: config.umsBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Store current access token for interceptor
let currentAccessToken: string | null = null

/**
 * Set access token for UMS API calls
 * This token will be added to all subsequent requests via interceptor
 */
export function setUmsAccessToken(token: string | null) {
  currentAccessToken = token
}

/**
 * Get current access token
 */
export function getUmsAccessToken(): string | null {
  return currentAccessToken
}

// Add interceptor to include access token in requests
umsClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAccessToken) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Custom mutator for Orval-generated UMS API functions
 * This function is used by Orval to make API calls
 * Access token is automatically added via interceptor if setUmsAccessToken was called
 */
export const umsMutator = async <T = any, D = any>(
  config: AxiosRequestConfig<D>
): Promise<AxiosResponse<T>> => {
  return umsClient.request<T, AxiosResponse<T>, D>(config)
}

