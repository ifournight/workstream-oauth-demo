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
 * 2. Dynamically from request (for Vercel deployments)
 * 3. Fallback to localhost:3000 for development
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
      // First, try to extract from request.url (most reliable)
      const url = request.url;
      if (url) {
        const urlObj = new URL(url);
        return `${urlObj.protocol}//${urlObj.host}`;
      }

      // Fallback: Try to construct from headers (for Vercel/proxy scenarios)
      const headers = request.headers;
      if (headers) {
        const host = headers.get('host') || headers.get('x-forwarded-host');
        if (host) {
          // Determine protocol from headers
          // Vercel sets x-forwarded-proto header
          const protocol = headers.get('x-forwarded-proto') || 
                         (headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http');
          return `${protocol}://${host}`;
        }
      }
    } catch (error) {
      console.warn('Failed to extract base URL from request:', error);
    }
  }

  // Priority 3: Fallback to localhost for development
  return 'http://localhost:3000';
}

