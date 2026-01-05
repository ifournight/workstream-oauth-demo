import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/lib/config'

/**
 * Hydra Admin API client instance
 * Configured with baseURL from environment config
 */
export const hydraClient = axios.create({
  baseURL: config.hydraAdminUrl,
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

