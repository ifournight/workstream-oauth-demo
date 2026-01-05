/**
 * Centralized environment configuration
 * All environment variables are defined here for better maintainability
 */

export interface EnvConfig {
  // Hydra Configuration
  hydraPublicUrl: string;
  hydraAdminUrl: string;
  
  // UMS Configuration
  umsBaseUrl: string;
  
  // OAuth Client Configuration
  clientId: string;
  clientSecret: string;
  
  // Server Configuration
  port: number;
  
  // API Testing Configuration
  testApiUrl: string;
  companyId: string;
  
  // Access Control Configuration
  globalClientsAdminIdentityIds: string[];
}

/**
 * Load and validate environment configuration
 */
export function loadConfig(): EnvConfig {
  const config: EnvConfig = {
    // Hydra Configuration
    hydraPublicUrl: process.env.HYDRA_PUBLIC_URL || 'https://hydra-public.priv.dev.workstream.is',
    hydraAdminUrl: process.env.HYDRA_ADMIN_URL || 'https://hydra-admin.priv.dev.workstream.is',
    
    // UMS Configuration
    umsBaseUrl: process.env.UMS_BASE_URL || '',
    
    // OAuth Client Configuration
    clientId: process.env.CLIENT_ID || '',
    clientSecret: process.env.CLIENT_SECRET || '',
    
    // Server Configuration
    port: parseInt(process.env.PORT || '3000', 10),
    
    // API Testing Configuration
    testApiUrl: process.env.TEST_API_URL || 'https://ws-public-api.dev.workstream.us/time-shift/v2/managers/time_entries?startDate=2025-12-22&endDate=2025-12-29&locationIds%5B0%5D=6fced117-6a57-49cf-a131-12862a962272&statuses%5B0%5D=ended&statuses%5B1%5D=approved&statuses%5B2%5D=started&sortField=clockIn&sortOrder=desc&limit=50',
    companyId: process.env.COMPANY_ID || 'eef568a4-86e4-4b51-bfeb-dc4daa831f6e',
    
    // Access Control Configuration
    // Comma-separated list of identity IDs that can manage global clients
    globalClientsAdminIdentityIds: process.env.GLOBAL_CLIENTS_ADMIN_IDENTITY_IDS
      ? process.env.GLOBAL_CLIENTS_ADMIN_IDENTITY_IDS.split(',').map(id => id.trim()).filter(Boolean)
      : [],
  };

  return config;
}

// Export singleton instance
export const config = loadConfig();

/**
 * Get the base URL for the application
 * Priority:
 * 1. NEXT_PUBLIC_BASE_URL environment variable (if set)
 * 2. Dynamically from request headers (for Vercel deployments - most reliable)
 * 3. Dynamically from request.url
 * 4. Fallback to localhost:3000 for development
 * 
 * @param request - Optional NextRequest to extract base URL from
 * @returns Base URL (e.g., https://example.com or http://localhost:3000)
 */
export function getBaseUrl(request?: { url?: string; headers?: Headers }): string {
  // Priority 1: Use environment variable if set
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Priority 2: Extract from request if available
  if (request) {
    try {
      // In Vercel/proxy environments, headers are more reliable than request.url
      const headers = request.headers;
      if (headers) {
        // Vercel sets x-forwarded-host and x-forwarded-proto headers
        const forwardedHost = headers.get('x-forwarded-host');
        const hostHeader = headers.get('host');
        const host = forwardedHost || hostHeader;
        
        if (host) {
          // Determine protocol from headers
          // Vercel always sets x-forwarded-proto to 'https' for production
          // If not set, default to 'https' for Vercel deployments (check via VERCEL env var)
          const forwardedProto = headers.get('x-forwarded-proto');
          const protocol = forwardedProto || (process.env.VERCEL ? 'https' : 'http');
          const baseUrl = `${protocol}://${host}`;
          
          // Debug logging - always log in development, or when DEBUG_BASE_URL is set
          if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_BASE_URL) {
            console.log('[getBaseUrl] Successfully extracted base URL:', {
              forwardedHost,
              hostHeader,
              forwardedProto,
              protocol,
              baseUrl,
              vercel: process.env.VERCEL,
              nodeEnv: process.env.NODE_ENV,
            });
          }
          
          return baseUrl;
          
          return baseUrl;
        }
      }

      // Fallback: Try to extract from request.url
      const url = request.url;
      if (url) {
        // request.url might be a full URL or relative path
        try {
          const urlObj = new URL(url);
          return `${urlObj.protocol}//${urlObj.host}`;
        } catch {
          // If url is relative, try to construct from headers again
          const headers = request.headers;
          if (headers) {
            const host = headers.get('x-forwarded-host') || headers.get('host');
            if (host) {
              const protocol = headers.get('x-forwarded-proto') || 'https';
              return `${protocol}://${host}`;
            }
          }
        }
      }
    } catch (error) {
      console.error('[getBaseUrl] Failed to extract base URL from request:', error);
      // Log request details for debugging
      if (request?.headers) {
        console.error('[getBaseUrl] Request details:', {
          host: request.headers.get('host'),
          'x-forwarded-host': request.headers.get('x-forwarded-host'),
          'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
          url: request.url,
          allHeaders: Object.fromEntries(request.headers.entries()),
        });
      }
    }
  }

  // Priority 3: Fallback to localhost for development
  const fallbackUrl = 'http://localhost:3000';
  console.warn('[getBaseUrl] Using fallback URL:', fallbackUrl, {
    hasRequest: !!request,
    hasUrl: !!request?.url,
    hasHeaders: !!request?.headers,
    nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  });
  return fallbackUrl;
}

